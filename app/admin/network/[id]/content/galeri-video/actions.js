'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import pool, { query } from '@/lib/db'

async function authorize(websiteId) {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !access) throw new Error('Sesi berakhir. Silakan masuk kembali.')
  const result = await query('SELECT id, user_id, name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [websiteId])
  const website = result.rows[0]
  if (!website || (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id)) {
    throw new Error('Anda tidak memiliki izin mengelola galeri website ini.')
  }
  return { session, website }
}

async function activity(client, sessionId, websiteId, action, description) {
  await client.query('INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)', [sessionId, websiteId, action, description])
}

function refresh(websiteId, albumId) {
  revalidatePath(`/admin/network/${websiteId}/content`)
  revalidatePath(`/admin/network/${websiteId}/content/galeri-video`)
  if (albumId) revalidatePath(`/admin/network/${websiteId}/content/galeri-video/${albumId}`)
}

export async function createVideoAlbumAction(websiteId, formData) {
  try {
    const { session, website } = await authorize(websiteId)
    const title = formData.get('title')?.trim()
    const date = formData.get('album_date')
    if (!title || title.length > 255) return { error: 'Nama album wajib diisi, maksimal 255 karakter.' }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return { error: 'Tanggal kegiatan wajib diisi dengan tanggal yang valid.' }
    const client = await pool.connect()
    let album
    try {
      await client.query('BEGIN')
      const result = await client.query("INSERT INTO gallery_albums (website_id, type, title, album_date, created_at, updated_at) VALUES ($1, 'video', $2, $3, NOW(), NOW()) RETURNING id, title, album_date, created_at", [website.id, title, date])
      album = result.rows[0]
      await activity(client, session.id, website.id, 'create_video_album', `${website.name}: membuat album video "${title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    refresh(website.id)
    return { success: true, message: 'Album video berhasil dibuat.', album: { ...album, item_count: 0 } }
  } catch (error) { console.error('Create video album error:', error); return { error: error.message || 'Gagal membuat album video.' } }
}

export async function updateVideoAlbumAction(websiteId, albumId, formData) {
  try {
    const { session, website } = await authorize(websiteId)
    const title = formData.get('title')?.trim()
    const date = formData.get('album_date')
    if (!title || title.length > 255) return { error: 'Nama album wajib diisi, maksimal 255 karakter.' }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return { error: 'Tanggal kegiatan wajib diisi dengan tanggal yang valid.' }
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query("UPDATE gallery_albums SET title = $1, album_date = $2, updated_at = NOW() WHERE id = $3 AND website_id = $4 AND type = 'video' RETURNING title", [title, date, albumId, website.id])
      if (!result.rows[0]) throw new Error('Album video tidak ditemukan.')
      await activity(client, session.id, website.id, 'update_video_album', `${website.name}: memperbarui album video "${title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    refresh(website.id, albumId)
    return { success: true, message: 'Informasi album berhasil disimpan.' }
  } catch (error) { console.error('Update video album error:', error); return { error: error.message || 'Gagal memperbarui album.' } }
}

export async function addVideoUrlAction(websiteId, albumId, formData) {
  try {
    const { session, website } = await authorize(websiteId)
    const rawUrl = formData.get('url')?.trim()
    const title = formData.get('title')?.trim()
    const description = formData.get('description')?.trim() || null
    if (!title || title.length > 255) return { error: 'Judul video wajib diisi, maksimal 255 karakter.' }
    if (description && description.length > 5000) return { error: 'Deskripsi video maksimal 5.000 karakter.' }
    let parsed
    try { parsed = new URL(rawUrl) } catch { return { error: 'Masukkan URL video yang valid.' } }
    if (!['https:', 'http:'].includes(parsed.protocol)) return { error: 'URL video harus menggunakan http atau https.' }
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const allowed = ['youtube.com', 'youtu.be', 'youtube-nocookie.com', 'tiktok.com', 'instagram.com', 'x.com', 'twitter.com']
    if (!allowed.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) return { error: 'Tautan hanya mendukung YouTube, TikTok, Instagram, atau X.' }
    const albumResult = await query("SELECT id, title FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'video' LIMIT 1", [albumId, website.id])
    const album = albumResult.rows[0]
    if (!album) return { error: 'Album video tidak ditemukan.' }
    const type = ['youtube.com', 'youtu.be', 'youtube-nocookie.com'].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)) ? 'youtube' : 'video'
    const client = await pool.connect()
    let item
    try {
      await client.query('BEGIN')
      const result = await client.query('INSERT INTO gallery_items (gallery_album_id, type, path, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, gallery_album_id, type, path, name, description, created_at', [album.id, type, parsed.toString(), title, description])
      item = result.rows[0]
      await activity(client, session.id, website.id, 'add_video_url', `${website.name}: menambahkan tautan video "${title}" ke album "${album.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    refresh(website.id, album.id)
    return { success: true, message: 'Tautan video berhasil ditambahkan.', item }
  } catch (error) { console.error('Add video URL error:', error); return { error: error.message || 'Gagal menambahkan tautan video.' } }
}

export async function deleteVideoItemAction(websiteId, albumId, itemId) {
  try {
    const { session, website } = await authorize(websiteId)
    const client = await pool.connect()
    let item
    try {
      await client.query('BEGIN')
      const result = await client.query("DELETE FROM gallery_items gi USING gallery_albums ga WHERE gi.id = $1 AND gi.gallery_album_id = ga.id AND ga.id = $2 AND ga.website_id = $3 AND ga.type = 'video' RETURNING gi.path, gi.name, ga.title AS album_title", [itemId, albumId, website.id])
      item = result.rows[0]
      if (!item) throw new Error('Video tidak ditemukan dalam album ini.')
      await activity(client, session.id, website.id, 'delete_video_item', `${website.name}: menghapus video "${item.name || 'Tanpa judul'}" dari album "${item.album_title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    if (item.path.startsWith(`/uploads/gallery/${website.id}/${albumId}/`)) {
      const { unlink } = await import('node:fs/promises')
      const path = await import('node:path')
      const root = path.resolve(process.cwd(), 'public', 'uploads', 'gallery', String(website.id), String(albumId))
      const file = path.resolve(process.cwd(), 'public', item.path.slice(1))
      if (file.startsWith(`${root}${path.sep}`)) await unlink(file).catch((error) => console.warn('Could not remove video file:', error.message))
    }
    refresh(website.id, albumId)
    return { success: true, message: 'Video berhasil dihapus.' }
  } catch (error) { console.error('Delete video item error:', error); return { error: error.message || 'Gagal menghapus video.' } }
}

export async function deleteVideoAlbumAction(websiteId, albumId) {
  try {
    const { session, website } = await authorize(websiteId)
    const client = await pool.connect()
    let title
    let count = 0
    try {
      await client.query('BEGIN')
      const album = await client.query("SELECT id, title FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'video' FOR UPDATE", [albumId, website.id])
      if (!album.rows[0]) throw new Error('Album video tidak ditemukan.')
      title = album.rows[0].title
      const items = await client.query('SELECT COUNT(*)::int AS count FROM gallery_items WHERE gallery_album_id = $1', [albumId])
      count = items.rows[0].count
      await client.query('DELETE FROM gallery_albums WHERE id = $1 AND website_id = $2', [albumId, website.id])
      await activity(client, session.id, website.id, 'delete_video_album', `${website.name}: menghapus album video "${title}" beserta ${count} item.`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    const { rm } = await import('node:fs/promises')
    const path = await import('node:path')
    const root = path.resolve(process.cwd(), 'public', 'uploads', 'gallery')
    const dir = path.resolve(root, String(website.id), String(albumId))
    if (dir.startsWith(`${root}${path.sep}`)) await rm(dir, { recursive: true, force: true }).catch((error) => console.warn('Could not remove video directory:', error.message))
    refresh(website.id)
    return { success: true, message: `Album video dihapus bersama ${count} item.` }
  } catch (error) { console.error('Delete video album error:', error); return { error: error.message || 'Gagal menghapus album video.' } }
}
