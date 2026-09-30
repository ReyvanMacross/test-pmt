'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Helper otorisasi website (termasuk yang sudah di-trash)
async function authorizeWebsite(websiteId, session) {
  if (session.role === 'super-admin') return true

  const res = await query(
    'SELECT user_id FROM websites WHERE id = $1 LIMIT 1',
    [websiteId]
  )
  if (res.rows.length === 0 || res.rows[0].user_id !== session.id) {
    throw new Error('Anda tidak memiliki izin mengelola website ini.')
  }
  return true
}

// ─── 1. CREATE WEBSITE ACTION ────────────────────────────────────────────────
export async function createWebsiteAction(formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = formData.get('name')?.trim()
  const subdomain = formData.get('subdomain')?.trim().toLowerCase()
  const template_id = formData.get('template_id')
  const description = formData.get('description')?.trim() || null

  if (!name || !subdomain || !template_id) {
    return { error: 'Nama, subdomain, dan template wajib diisi.' }
  }

  // Validasi format subdomain
  const regex = /^[a-z0-9-]+$/
  if (!regex.test(subdomain)) {
    return { error: 'Subdomain hanya boleh huruf kecil, angka, dan tanda hubung (-)' }
  }

  try {
    // Cek keunikan subdomain
    const checkSubdomain = await query(
      'SELECT id FROM websites WHERE subdomain = $1 AND deleted_at IS NULL LIMIT 1',
      [subdomain]
    )
    if (checkSubdomain.rows.length > 0) {
      return { error: 'Subdomain sudah digunakan oleh instansi lain. Silakan pilih subdomain lain.' }
    }

    // Insert ke tabel websites
    const res = await query(
      `INSERT INTO websites (user_id, name, subdomain, template_id, description, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, name`,
      [session.id, name, subdomain, template_id, description]
    )

    const newWebsite = res.rows[0]

    // Buat profil wilayah kosong otomatis jika templatenya kecamatan/kelurahan
    const tplRes = await query('SELECT slug FROM templates WHERE id = $1', [template_id])
    if (tplRes.rows.length > 0) {
      const slug = tplRes.rows[0].slug
      if (slug === 'kecamatan' || slug === 'kelurahan') {
        await query(
          'INSERT INTO wilayah_profiles (website_id, judul_profil) VALUES ($1, $2) ON CONFLICT (website_id) DO NOTHING',
          [newWebsite.id, `Profil ${name}`]
        )
      }
    }

    // Catat log aktivitas
    await query(
      'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
      [session.id, newWebsite.id, 'create_website', `Membuat website baru: ${name}`]
    )
  } catch (err) {
    console.error('Error createWebsite:', err)
    return { error: 'Gagal menyimpan website baru. Silakan coba lagi.' }
  }

  revalidatePath('/admin/network')
  redirect('/admin/network')
}

// ─── 2. UPDATE WEBSITE ACTION ────────────────────────────────────────────────
export async function updateWebsiteAction(id, formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  await authorizeWebsite(id, session)

  const name = formData.get('name')?.trim()
  const subdomain = formData.get('subdomain')?.trim().toLowerCase()
  const template_id = formData.get('template_id')
  const status = formData.get('status') || 'active'
  const description = formData.get('description')?.trim() || null

  if (!name || !subdomain || !template_id) {
    return { error: 'Nama, subdomain, dan template wajib diisi.' }
  }

  const regex = /^[a-z0-9-]+$/
  if (!regex.test(subdomain)) {
    return { error: 'Subdomain hanya boleh huruf kecil, angka, dan tanda hubung (-)' }
  }

  try {
    // Cek keunikan subdomain selain id saat ini
    const checkSubdomain = await query(
      'SELECT id FROM websites WHERE subdomain = $1 AND id != $2 AND deleted_at IS NULL LIMIT 1',
      [subdomain, id]
    )
    if (checkSubdomain.rows.length > 0) {
      return { error: 'Subdomain sudah digunakan. Silakan gunakan nama subdomain lain.' }
    }

    await query(
      `UPDATE websites
       SET name = $1, subdomain = $2, template_id = $3, status = $4, description = $5, updated_at = NOW()
       WHERE id = $6`,
      [name, subdomain, template_id, status, description, id]
    )

    // Catat log aktivitas
    await query(
      'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
      [session.id, id, 'update_website', `Mengupdate website: ${name}`]
    )
  } catch (err) {
    console.error('Error updateWebsite:', err)
    return { error: 'Gagal memperbarui website. Silakan coba lagi.' }
  }

  revalidatePath('/admin/network')
  redirect('/admin/network')
}

// ─── 3. DELETE (SOFT DELETE) WEBSITE ACTION ──────────────────────────────────
export async function deleteWebsiteAction(formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const id = formData.get('id')

  try {
    await authorizeWebsite(id, session)

    const res = await query('SELECT name FROM websites WHERE id = $1', [id])
    const websiteName = res.rows[0]?.name || 'Website'

    await query('UPDATE websites SET deleted_at = NOW() WHERE id = $1', [id])

    await query(
      'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
      [session.id, id, 'delete_website', `Menghapus website: ${websiteName}`]
    )
  } catch (err) {
    console.error('Error deleteWebsite:', err)
    return { error: err.message || 'Gagal menghapus website.' }
  }

  revalidatePath('/admin/network')
  revalidatePath('/admin/network/trashed')
  return { success: true, message: 'Website berhasil dipindahkan ke sampah.' }
}

// ─── 4. RESTORE WEBSITE ACTION ───────────────────────────────────────────────
export async function restoreWebsiteAction(formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const id = formData.get('id')

  try {
    await authorizeWebsite(id, session)

    const res = await query('SELECT name FROM websites WHERE id = $1', [id])
    const websiteName = res.rows[0]?.name || 'Website'

    await query('UPDATE websites SET deleted_at = NULL, status = $1, updated_at = NOW() WHERE id = $2', ['active', id])

    await query(
      'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
      [session.id, id, 'restore_website', `Memulihkan website dari sampah: ${websiteName}`]
    )
  } catch (err) {
    console.error('Error restoreWebsite:', err)
    return { error: err.message || 'Gagal memulihkan website.' }
  }

  revalidatePath('/admin/network')
  revalidatePath('/admin/network/trashed')
  return { success: true, message: 'Website berhasil dipulihkan.' }
}

// ─── 5. PERMANENT DELETE WEBSITE ACTION ──────────────────────────────────────
export async function permanentDeleteWebsiteAction(formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Hanya super-admin yang bisa hapus permanen
  if (session.role !== 'super-admin') {
    return { error: 'Hanya Super Administrator yang dapat menghapus website secara permanen.' }
  }

  const id = formData.get('id')

  try {
    const res = await query('SELECT name FROM websites WHERE id = $1', [id])
    const websiteName = res.rows[0]?.name || 'Website'

    // Hapus data terkait dulu (cascade manual jika FK tidak CASCADE)
    // menu_items tidak punya kolom website_id, jadi skip (atau CASCADE otomatis)
    await query('DELETE FROM activity_logs WHERE website_id = $1', [id])
    await query('DELETE FROM gallery_items WHERE album_id IN (SELECT id FROM gallery_albums WHERE website_id = $1)', [id])
    await query('DELETE FROM gallery_albums WHERE website_id = $1', [id])
    await query('DELETE FROM news_items WHERE website_id = $1', [id])
    await query('DELETE FROM contents WHERE website_id = $1', [id])
    await query('DELETE FROM wilayah_profiles WHERE website_id = $1', [id])
    await query('DELETE FROM websites WHERE id = $1', [id])

    // Log ke activity_logs global (user level, tanpa website_id)
    await query(
      'INSERT INTO activity_logs (user_id, action, description) VALUES ($1, $2, $3)',
      [session.id, 'permanent_delete_website', `Menghapus permanen website: ${websiteName} (id: ${id})`]
    )
  } catch (err) {
    console.error('Error permanentDeleteWebsite:', err)
    return { error: 'Gagal menghapus website secara permanen.' }
  }

  revalidatePath('/admin/network')
  revalidatePath('/admin/network/trashed')
  return { success: true, message: 'Website berhasil dihapus secara permanen.' }
}

