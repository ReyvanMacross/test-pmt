'use server'


import { canManageWebsite } from '@/lib/website-access'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { revalidatePath } from 'next/cache'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { CONTENT_MODULES } from '@/lib/content-modules'
import { removePortalFile, uploadPortalFile } from '@/lib/storage'
import { PNS_RANK_OPTIONS } from '@/lib/pns-ranks'
import { getPublicDocumentsForAdmin } from '@/lib/public-documents'

const REMOVED_MODULES = new Set(['permohonan-informasi-online', 'pengajuan-keberatan-online'])

// ─── Helper Otorisasi Website ─────────────────────────────────────────────────
async function authorizeWebsite(websiteId, session) {
  const res = await query(
    'SELECT user_id FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [websiteId]
  )
  if (res.rows.length === 0 || !(await canManageWebsite(session, websiteId, res.rows[0].user_id))) {
    throw new Error('Anda tidak memiliki izin mengelola konten website ini.')
  }
  return true
}

export async function setWebsiteModuleVisibilityAction(websiteId, moduleSlug, isEnabled) {
  try {
    const session = await getSession()
    if (!session) return { error: 'Sesi berakhir. Silakan masuk kembali.' }
    if (typeof isEnabled !== 'boolean') return { error: 'Status modul tidak valid.' }
    if (!CONTENT_MODULES.some((module) => module.slug === moduleSlug)) {
      return { error: 'Modul yang dipilih tidak dikenali.' }
    }
    await authorizeWebsite(websiteId, session)

    await query(
      `INSERT INTO website_module_settings (website_id, module_slug, is_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (website_id, module_slug)
       DO UPDATE SET is_enabled = EXCLUDED.is_enabled, updated_at = NOW()`,
      [websiteId, moduleSlug, isEnabled]
    )

    const websiteResult = await query('SELECT subdomain FROM websites WHERE id = $1 LIMIT 1', [websiteId])
    revalidatePath(`/admin/network/${websiteId}/content`)
    if (websiteResult.rows[0]?.subdomain) revalidatePath(`/${websiteResult.rows[0].subdomain}`)
    return { success: true, isEnabled }
  } catch (error) {
    console.error('Error updating website module visibility:', error)
    return { error: error.message || 'Pengaturan modul gagal disimpan.' }
  }
}

// ─── Helper Dapatkan atau Buat menu_item_id ────────────────────────────────────
async function getOrCreateMenuItemId(slug) {
  // Cek apakah sudah ada di database
  const findRes = await query('SELECT id FROM menu_items WHERE slug = $1 LIMIT 1', [slug])
  if (findRes.rows.length > 0) {
    return findRes.rows[0].id
  }

  // Jika belum ada, ambil info dari CONTENT_MODULES
  const meta = CONTENT_MODULES.find((m) => m.slug === slug)
  const name = meta ? meta.title : slug.replace(/-/g, ' ')

  const insertRes = await query(
    `INSERT INTO menu_items (name, slug, "order", available_for, is_active)
     VALUES ($1, $2, 0, ARRAY['dinas', 'kecamatan', 'kelurahan'], true)
     RETURNING id`,
    [name, slug]
  )
  return insertRes.rows[0].id
}

// ─── 1. SIMPAN KONTEN MODUL ───────────────────────────────────────────────────
export async function saveModuleContentAction(websiteId, moduleSlug, formData) {
  let uploadedFile = null
  let uploadedHeroFile = null
  try {
    if (REMOVED_MODULES.has(moduleSlug)) return { error: 'Modul ini sudah tidak digunakan.' }
    const session = await getSession()
    if (!session) return { error: 'Sesi berakhir. Silakan masuk kembali.' }
    await authorizeWebsite(websiteId, session)

    const title = formData.get('title')?.trim() || null
    const body = formData.get('body')?.trim() || null
    const pangkatGolongan = moduleSlug === 'profil-pimpinan'
      ? String(formData.get('pangkat_golongan') || '').trim()
      : null
    const sambutanQuote = moduleSlug === 'profil-pimpinan'
      ? String(formData.get('sambutan_quote') || '').trim().slice(0, 5000)
      : null
    const externalPortalUrl = moduleSlug === 'ppid-utama'
      ? String(formData.get('external_url') || '').trim()
      : null
    if (moduleSlug === 'ppid-utama' && externalPortalUrl.length > 2000) {
      return { error: 'Tautan PPID Utama maksimal 2.000 karakter.' }
    }
    if (moduleSlug === 'ppid-utama' && externalPortalUrl) {
      try {
        const url = new URL(externalPortalUrl)
        if (url.protocol !== 'https:' || !url.hostname) throw new Error()
      } catch {
        return { error: 'Tautan PPID Utama harus berupa alamat HTTPS yang valid.' }
      }
    }
    if (moduleSlug === 'profil-pimpinan' && pangkatGolongan && !PNS_RANK_OPTIONS.some(([value]) => value === pangkatGolongan)) {
      return { error: 'Pangkat atau golongan PNS yang dipilih tidak valid.' }
    }
    const removeFile = formData.get('remove_file') === 'true'
    const file = formData.get('file')

    const hasUpload = file && typeof file === 'object' && typeof file.size === 'number' && file.size > 0
    const hasFileChange = Boolean(removeFile || hasUpload)
    const allowedTypes = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ])

    let newImages = '[]'
    let newFiles = '[]'
    const menuItemId = await getOrCreateMenuItemId(moduleSlug)
    const currentResult = await query(
      'SELECT images, files, metadata FROM contents WHERE website_id = $1 AND menu_item_id = $2 LIMIT 1',
      [websiteId, menuItemId]
    )
    const currentContent = currentResult.rows[0]
    const metadata = currentContent?.metadata && typeof currentContent.metadata === 'object' && !Array.isArray(currentContent.metadata)
      ? { ...currentContent.metadata }
      : {}
    const pageHeroFile = formData.get('page_hero_file')
    const removePageHero = formData.get('remove_page_hero') === 'true'
    const hasPageHeroUpload = pageHeroFile && typeof pageHeroFile === 'object' && typeof pageHeroFile.size === 'number' && pageHeroFile.size > 0
    const oldPageHero = metadata.page_hero_image
    if (hasPageHeroUpload) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(pageHeroFile.type)) return { error: 'Gambar header harus JPG, PNG, atau WebP.' }
      if (pageHeroFile.size > 5 * 1024 * 1024) return { error: 'Gambar header maksimal 5 MB.' }
      const ext = path.extname(pageHeroFile.name || '').toLowerCase() || ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[pageHeroFile.type])
      uploadedHeroFile = await uploadPortalFile({ file: pageHeroFile, objectPath: `websites/${websiteId}/page-heroes/${moduleSlug}/${randomUUID()}${ext}` })
      metadata.page_hero_image = { url: uploadedHeroFile.publicUrl, path: uploadedHeroFile.path, name: pageHeroFile.name, type: pageHeroFile.type }
    } else if (removePageHero) {
      delete metadata.page_hero_image
    }
    if (moduleSlug === 'profil-pimpinan') {
      metadata.pangkat_golongan = pangkatGolongan || null
      metadata.sambutan_quote = sambutanQuote || null
    }
    if (moduleSlug === 'ppid-utama') metadata.external_url = externalPortalUrl || null
    if (moduleSlug === 'struktur-organisasi') {
      const organizationMode = String(formData.get('organization_mode') || 'image')
      if (!['image', 'builder'].includes(organizationMode)) {
        return { error: 'Mode struktur organisasi tidak valid.' }
      }
      let organizationChart
      try {
        organizationChart = JSON.parse(String(formData.get('organization_chart') || '[]'))
      } catch {
        return { error: 'Data bagan organisasi tidak terbaca.' }
      }
      if (!Array.isArray(organizationChart) || organizationChart.length > 100) {
        return { error: 'Bagan organisasi tidak valid atau melebihi 100 jabatan.' }
      }
      organizationChart = organizationChart.map((row) => ({
        jabatan: String(row?.jabatan || '').trim().slice(0, 160),
        nama: String(row?.nama || '').trim().slice(0, 160),
        level: Math.min(4, Math.max(1, Number(row?.level) || 1)),
      })).filter((row) => row.jabatan)
      if (organizationMode === 'builder' && organizationChart.length === 0) {
        return { error: 'Tambahkan setidaknya satu jabatan pada bagan organisasi.' }
      }
      metadata.organization_mode = organizationMode
      metadata.organization_chart = organizationChart
    }

    if (hasUpload) {
      if (file.size > 5 * 1024 * 1024) {
        return { error: 'Ukuran berkas melebihi batas maksimal 5MB.' }
      }
      if (!allowedTypes.has(file.type)) {
        return { error: 'Berkas hanya mendukung JPG, PNG, WebP, GIF, PDF, DOC, atau DOCX.' }
      }

      const ext = path.extname(file.name || '').toLowerCase() || (file.type?.startsWith('image/') ? '.png' : '.pdf')
      const cleanBase = path.basename(file.name || 'berkas', ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
      const objectPath = `websites/${websiteId}/contents/${moduleSlug}/${randomUUID()}_${cleanBase}${ext}`
      uploadedFile = await uploadPortalFile({ file, objectPath })

      const fileMeta = {
        url: uploadedFile.publicUrl,
        path: uploadedFile.path,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploaded_at: new Date().toISOString(),
      }

      if (file.type?.startsWith('image/')) {
        newImages = JSON.stringify([fileMeta])
        newFiles = '[]'
      } else {
        newFiles = JSON.stringify([fileMeta])
        newImages = '[]'
      }
    } else if (removeFile) {
      newImages = '[]'
      newFiles = '[]'
    }

    // Upsert konten modul
    await query(
      `INSERT INTO contents (website_id, menu_item_id, title, body, images, files, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, NOW())
       ON CONFLICT (website_id, menu_item_id)
       DO UPDATE SET
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         images = CASE WHEN $8::boolean = true THEN EXCLUDED.images ELSE contents.images END,
         files = CASE WHEN $8::boolean = true THEN EXCLUDED.files ELSE contents.files END,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
      [websiteId, menuItemId, title, body, newImages, newFiles, JSON.stringify(metadata), hasFileChange]
    )

    if (hasFileChange && currentContent) {
      const oldFiles = [...(Array.isArray(currentContent.images) ? currentContent.images : []), ...(Array.isArray(currentContent.files) ? currentContent.files : [])]
      await Promise.all(oldFiles.map((entry) => removePortalFile(entry?.url || entry?.path).catch((error) => {
        console.warn('Could not remove replaced Supabase content file:', error.message)
      })))
    }
    if ((hasPageHeroUpload || removePageHero) && oldPageHero?.path) {
      await removePortalFile(oldPageHero.url || oldPageHero.path).catch((error) => console.warn('Could not remove previous page hero image:', error.message))
    }

    // Dapatkan nama website untuk logging
    const wsRes = await query('SELECT name FROM websites WHERE id = $1 LIMIT 1', [websiteId])
    const websiteName = wsRes.rows[0]?.name || 'Website'

    const meta = CONTENT_MODULES.find((m) => m.slug === moduleSlug)
    const moduleTitle = meta ? meta.title : moduleSlug

    // Catat ke activity_logs
    await query(
      `INSERT INTO activity_logs (user_id, website_id, action, description)
       VALUES ($1, $2, $3, $4)`,
      [
        session.id,
        websiteId,
        'update_content',
        `${websiteName}: Menyunting konten modul ${moduleTitle}.`,
      ]
    )

    revalidatePath(`/admin/network/${websiteId}/content`)
    revalidatePath(`/admin/network/${websiteId}/content/${moduleSlug}`)
    const publicSite = await query('SELECT subdomain FROM websites WHERE id = $1 LIMIT 1', [websiteId])
    if (publicSite.rows[0]?.subdomain) revalidatePath(`/${publicSite.rows[0].subdomain}/${moduleSlug}`)
    revalidatePath('/admin/dashboard')

    return { success: true, message: `Konten ${moduleTitle} berhasil disimpan.` }
  } catch (err) {
    if (uploadedFile?.path) await removePortalFile(`${uploadedFile.bucket}/${uploadedFile.path}`).catch(() => {})
    if (uploadedHeroFile?.path) await removePortalFile(`${uploadedHeroFile.bucket}/${uploadedHeroFile.path}`).catch(() => {})
    console.error('Error saving module content:', err)
    return { error: err.message || 'Gagal menyimpan konten. Silakan coba lagi.' }
  }
}

export async function saveModuleHeroImageAction(websiteId, moduleSlug, formData) {
  let uploaded = null
  try {
    const session = await getSession()
    if (!session) return { error: 'Sesi berakhir. Silakan masuk kembali.' }
    await authorizeWebsite(websiteId, session)
    if (!CONTENT_MODULES.some((module) => module.slug === moduleSlug) || ['beranda', 'hero-slider'].includes(moduleSlug)) return { error: 'Gambar header tidak dapat diatur untuk halaman ini.' }
    const file = formData.get('page_hero_file')
    const removeImage = formData.get('remove_page_hero') === 'true'
    const hasUpload = file && typeof file === 'object' && typeof file.size === 'number' && file.size > 0
    if (!hasUpload && !removeImage) return { error: 'Pilih gambar header terlebih dahulu.' }
    if (hasUpload && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return { error: 'Gambar header harus JPG, PNG, atau WebP.' }
    if (hasUpload && file.size > 5 * 1024 * 1024) return { error: 'Gambar header maksimal 5 MB.' }

    const menuItemId = await getOrCreateMenuItemId(moduleSlug)
    const current = await query('SELECT title, body, images, files, metadata FROM contents WHERE website_id = $1 AND menu_item_id = $2 LIMIT 1', [websiteId, menuItemId])
    const row = current.rows[0] || {}
    const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? { ...row.metadata } : {}
    const oldImage = metadata.page_hero_image
    if (hasUpload) {
      const ext = path.extname(file.name || '').toLowerCase() || ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.type])
      uploaded = await uploadPortalFile({ file, objectPath: `websites/${websiteId}/page-heroes/${moduleSlug}/${randomUUID()}${ext}` })
      metadata.page_hero_image = { url: uploaded.publicUrl, path: uploaded.path, name: file.name, type: file.type }
    } else delete metadata.page_hero_image
    await query(`INSERT INTO contents (website_id, menu_item_id, title, body, images, files, metadata, updated_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, NOW())
      ON CONFLICT (website_id, menu_item_id) DO UPDATE SET metadata = EXCLUDED.metadata, updated_at = NOW()`,
      [websiteId, menuItemId, row.title || null, row.body || null, JSON.stringify(row.images || []), JSON.stringify(row.files || []), JSON.stringify(metadata)])
    if (oldImage?.url && (removeImage || hasUpload)) await removePortalFile(oldImage.url).catch(() => {})
    const websiteResult = await query('SELECT subdomain FROM websites WHERE id = $1 LIMIT 1', [websiteId])
    revalidatePath(`/admin/network/${websiteId}/content/${moduleSlug}`)
    if (websiteResult.rows[0]?.subdomain) revalidatePath(`/${websiteResult.rows[0].subdomain}/${moduleSlug}`)
    return { success: true, image: metadata.page_hero_image || null, message: 'Gambar header berhasil disimpan.' }
  } catch (error) {
    if (uploaded?.publicUrl) await removePortalFile(uploaded.publicUrl).catch(() => {})
    console.error('Save page hero image error:', error)
    return { error: error.message || 'Gagal menyimpan gambar header.' }
  }
}

const PUBLIC_DOCUMENT_EDITOR_MODULES = new Set([
  'ppid', 'ppid-utama', 'daftar-informasi-publik', 'daftar-informasi-dikecualikan',
  'informasi-wajib-berkala', 'informasi-tersedia-setiap-saat', 'informasi-serta-merta',
])

async function getPublicDocumentContent(websiteId, moduleSlug) {
  const menuItemId = await getOrCreateMenuItemId(moduleSlug)
  const result = await query(
    'SELECT title, body, images, files, metadata FROM contents WHERE website_id = $1 AND menu_item_id = $2 LIMIT 1',
    [websiteId, menuItemId]
  )
  return { menuItemId, row: result.rows[0] || null }
}

function publicDocumentMetadata(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {}
}

export async function savePublicDocumentIntroductionAction(websiteId, moduleSlug, formData) {
  try {
    const session = await getSession()
    if (!session) return { error: 'Sesi berakhir. Silakan masuk kembali.' }
    if (!PUBLIC_DOCUMENT_EDITOR_MODULES.has(moduleSlug)) return { error: 'Modul dokumen tidak dikenali.' }
    await authorizeWebsite(websiteId, session)
    const title = String(formData.get('title') || '').trim().slice(0, 255) || null
    const body = String(formData.get('body') || '').trim().slice(0, 20000) || null
    const externalUrl = moduleSlug === 'ppid-utama' ? String(formData.get('external_url') || '').trim().slice(0, 2000) : null
    if (moduleSlug === 'ppid-utama' && externalUrl) {
      try {
        const url = new URL(externalUrl)
        if (url.protocol !== 'https:' || !url.hostname) throw new Error()
      } catch { return { error: 'Tautan PPID Utama harus berupa alamat HTTPS yang valid.' } }
    }
    const { menuItemId, row } = await getPublicDocumentContent(websiteId, moduleSlug)
    const metadata = publicDocumentMetadata(row?.metadata)
    if (moduleSlug === 'ppid-utama') metadata.external_url = externalUrl || null
    await query(
      `INSERT INTO contents (website_id, menu_item_id, title, body, images, files, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, NOW())
       ON CONFLICT (website_id, menu_item_id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, metadata = EXCLUDED.metadata, updated_at = NOW()`,
      [websiteId, menuItemId, title, body, JSON.stringify(row?.images || []), JSON.stringify(row?.files || []), JSON.stringify(metadata)]
    )
    const website = await query('SELECT subdomain FROM websites WHERE id = $1 LIMIT 1', [websiteId])
    revalidatePath(`/admin/network/${websiteId}/content/${moduleSlug}`)
    if (website.rows[0]?.subdomain) revalidatePath(`/${website.rows[0].subdomain}/ppid`)
    return { success: true, message: 'Informasi pengantar berhasil disimpan.' }
  } catch (error) {
    console.error('Error saving public document introduction:', error)
    return { error: error.message || 'Informasi pengantar gagal disimpan.' }
  }
}

export async function savePublicDocumentItemAction(websiteId, moduleSlug, formData) {
  let uploadedFile = null
  try {
    const session = await getSession()
    if (!session) return { error: 'Sesi berakhir. Silakan masuk kembali.' }
    if (!PUBLIC_DOCUMENT_EDITOR_MODULES.has(moduleSlug)) return { error: 'Modul dokumen tidak dikenali.' }
    await authorizeWebsite(websiteId, session)
    const id = String(formData.get('document_id') || '').trim()
    const title = String(formData.get('document_title') || '').trim().slice(0, 255)
    const description = String(formData.get('document_description') || '').trim().slice(0, 4000)
    const revisionMonth = String(formData.get('revision_month') || '').trim()
    if (!title) return { error: 'Judul dokumen wajib diisi.' }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(revisionMonth)) return { error: 'Pilih bulan dan tahun pembaruan yang valid.' }
    const file = formData.get('document_file')
    const hasUpload = file && typeof file === 'object' && typeof file.size === 'number' && file.size > 0
    if (hasUpload && (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024)) {
      return { error: 'Berkas harus PDF dengan ukuran maksimal 10 MB.' }
    }
    const { menuItemId, row } = await getPublicDocumentContent(websiteId, moduleSlug)
    const metadata = publicDocumentMetadata(row?.metadata)
    const documents = [...getPublicDocumentsForAdmin(row)]
    const previousIndex = id ? documents.findIndex((item) => item.id === id) : -1
    if (id && previousIndex < 0) return { error: 'Dokumen yang akan diedit tidak ditemukan.' }
    if (!hasUpload && previousIndex < 0) return { error: 'Unggah berkas PDF untuk dokumen baru.' }
    const previous = previousIndex >= 0 ? documents[previousIndex] : null
    if (hasUpload) {
      const safeName = path.basename(file.name || 'dokumen.pdf').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
      uploadedFile = await uploadPortalFile({ file, objectPath: `websites/${websiteId}/public-documents/${moduleSlug}/${randomUUID()}_${safeName}` })
    }
    const nextDocument = {
      id: previous?.id || randomUUID(),
      title,
      description,
      revision_month: revisionMonth,
      attachment: hasUpload ? { url: uploadedFile.publicUrl, path: uploadedFile.path, bucket: uploadedFile.bucket, name: file.name, size: file.size, type: file.type } : previous.attachment,
      updated_at: new Date().toISOString(),
    }
    if (previousIndex >= 0) documents[previousIndex] = nextDocument
    else documents.unshift(nextDocument)
    metadata.public_documents = documents
    await query(
      `INSERT INTO contents (website_id, menu_item_id, title, body, images, files, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, NOW())
       ON CONFLICT (website_id, menu_item_id) DO UPDATE SET metadata = EXCLUDED.metadata, updated_at = NOW()`,
      [websiteId, menuItemId, row?.title || null, row?.body || null, JSON.stringify(row?.images || []), JSON.stringify(row?.files || []), JSON.stringify(metadata)]
    )
    uploadedFile = null
    if (hasUpload && previous?.attachment?.url) await removePortalFile(previous.attachment.url).catch((error) => console.warn('Could not remove replaced public document:', error.message))
    const website = await query('SELECT subdomain FROM websites WHERE id = $1 LIMIT 1', [websiteId])
    revalidatePath(`/admin/network/${websiteId}/content/${moduleSlug}`)
    if (website.rows[0]?.subdomain) revalidatePath(`/${website.rows[0].subdomain}/ppid`)
    return { success: true, document: nextDocument, message: previous ? 'Dokumen berhasil diperbarui.' : 'Dokumen berhasil ditambahkan.' }
  } catch (error) {
    if (uploadedFile?.publicUrl) await removePortalFile(uploadedFile.publicUrl).catch(() => {})
    console.error('Error saving public document:', error)
    return { error: error.message || 'Dokumen gagal disimpan.' }
  }
}

export async function deletePublicDocumentItemAction(websiteId, moduleSlug, documentId) {
  try {
    const session = await getSession()
    if (!session) return { error: 'Sesi berakhir. Silakan masuk kembali.' }
    if (!PUBLIC_DOCUMENT_EDITOR_MODULES.has(moduleSlug)) return { error: 'Modul dokumen tidak dikenali.' }
    await authorizeWebsite(websiteId, session)
    const { menuItemId, row } = await getPublicDocumentContent(websiteId, moduleSlug)
    const metadata = publicDocumentMetadata(row?.metadata)
    const documents = getPublicDocumentsForAdmin(row)
    const document = documents.find((item) => item.id === documentId)
    if (!document) return { error: 'Dokumen tidak ditemukan.' }
    metadata.public_documents = documents.filter((item) => item.id !== documentId)
    await query('UPDATE contents SET metadata = $3::jsonb, updated_at = NOW() WHERE website_id = $1 AND menu_item_id = $2', [websiteId, menuItemId, JSON.stringify(metadata)])
    if (document.attachment?.url) await removePortalFile(document.attachment.url).catch((error) => console.warn('Could not remove deleted public document:', error.message))
    const website = await query('SELECT subdomain FROM websites WHERE id = $1 LIMIT 1', [websiteId])
    revalidatePath(`/admin/network/${websiteId}/content/${moduleSlug}`)
    if (website.rows[0]?.subdomain) revalidatePath(`/${website.rows[0].subdomain}/ppid`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting public document:', error)
    return { error: error.message || 'Dokumen gagal dihapus.' }
  }
}
