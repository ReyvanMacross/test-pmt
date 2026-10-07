'use server'


import { canManageWebsite } from '@/lib/website-access'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { revalidatePath } from 'next/cache'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { CONTENT_MODULES } from '@/lib/content-modules'
import { removePortalFile, uploadPortalFile } from '@/lib/storage'

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
      'SELECT images, files FROM contents WHERE website_id = $1 AND menu_item_id = $2 LIMIT 1',
      [websiteId, menuItemId]
    )
    const currentContent = currentResult.rows[0]

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
      `INSERT INTO contents (website_id, menu_item_id, title, body, images, files, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW())
       ON CONFLICT (website_id, menu_item_id)
       DO UPDATE SET
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         images = CASE WHEN $7::boolean = true THEN EXCLUDED.images ELSE contents.images END,
         files = CASE WHEN $7::boolean = true THEN EXCLUDED.files ELSE contents.files END,
         updated_at = NOW()`,
      [websiteId, menuItemId, title, body, newImages, newFiles, hasFileChange]
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
