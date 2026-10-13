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
  try {
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
    if (moduleSlug === 'profil-pimpinan') {
      metadata.pangkat_golongan = pangkatGolongan || null
      metadata.sambutan_quote = sambutanQuote || null
    }
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
    revalidatePath('/admin/dashboard')

    return { success: true, message: `Konten ${moduleTitle} berhasil disimpan.` }
  } catch (err) {
    if (uploadedFile?.path) await removePortalFile(`${uploadedFile.bucket}/${uploadedFile.path}`).catch(() => {})
    console.error('Error saving module content:', err)
    return { error: err.message || 'Gagal menyimpan konten. Silakan coba lagi.' }
  }
}
