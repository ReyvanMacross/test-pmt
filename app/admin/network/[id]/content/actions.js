'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { CONTENT_MODULES } from '@/lib/content-modules'

// ─── Helper Otorisasi Website ─────────────────────────────────────────────────
async function authorizeWebsite(websiteId, session) {
  if (session.role === 'super-admin') return true

  const res = await query(
    'SELECT user_id FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [websiteId]
  )
  if (res.rows.length === 0 || res.rows[0].user_id !== session.id) {
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
  const session = await getSession()
  if (!session) redirect('/login')

  await authorizeWebsite(websiteId, session)

  const title = formData.get('title')?.trim() || null
  const body = formData.get('body')?.trim() || null

  try {
    const menuItemId = await getOrCreateMenuItemId(moduleSlug)

    // Upsert konten modul
    await query(
      `INSERT INTO contents (website_id, menu_item_id, title, body, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (website_id, menu_item_id)
       DO UPDATE SET
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         updated_at = NOW()`,
      [websiteId, menuItemId, title, body]
    )

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
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (err) {
    console.error('Error saving module content:', err)
    return { error: 'Gagal menyimpan konten. Silakan coba lagi.' }
  }
}
