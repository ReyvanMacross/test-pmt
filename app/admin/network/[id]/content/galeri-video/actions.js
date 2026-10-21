'use server'

import { randomUUID } from 'node:crypto'

import { canManageWebsite } from '@/lib/website-access'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import pool, { query } from '@/lib/db'
import { createPortalSignedUploadUrl, getPortalPublicUrl, getPortalStorageBucket, getPortalStorageObject, removePortalFile } from '@/lib/storage'

const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const VIDEO_TYPES = new Map([['video/mp4', '.mp4'], ['video/webm', '.webm']])

function parseVideoLink(rawUrl) {
  let parsed
  try { parsed = new URL(rawUrl) } catch { return { error: 'Masukkan tautan video yang valid.' } }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return { error: 'Tautan video harus menggunakan HTTPS yang aman.' }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
  if (['youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host) || host.endsWith('.youtube.com')) {
    const id = host === 'youtu.be' ? parsed.pathname.split('/').filter(Boolean)[0] : parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1]
    return id && /^[\w-]{6,20}$/.test(id) ? { parsed, type: 'youtube' } : { error: 'Tautan YouTube tidak memuat ID video yang valid.' }
  }
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    return /^\/(?:reel|reels|p|tv)\/[\w-]+\/?$/.test(parsed.pathname) ? { parsed, type: 'instagram' } : { error: 'Gunakan tautan Instagram Reel atau postingan video.' }
  }
  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch') {
    const validPath = host === 'fb.watch'
      ? /^\/[\w-]+\/?$/.test(parsed.pathname)
      : /^\/(?:watch(?:\/|\?|$)|reel\/|share\/[vrs]\/|[^/]+\/videos\/)/i.test(`${parsed.pathname}${parsed.search}`)
    return validPath ? { parsed, type: 'facebook' } : { error: 'Gunakan tautan Facebook Watch, Reel, atau video.' }
  }
  return { error: 'Tautan video mendukung YouTube, Instagram Reels, dan Facebook video.' }
}

function videoMetadataError(title, description) {
  if (!title || title.length > 255) return 'Judul video wajib diisi, maksimal 255 karakter.'
  if (description && description.length > 5000) return 'Deskripsi video maksimal 5.000 karakter.'
  return null
}

async function authorize(websiteId) {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !access) throw new Error('Sesi berakhir. Silakan masuk kembali.')
  const result = await query('SELECT id, user_id, name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [websiteId])
  const website = result.rows[0]
  if (!website || !(await canManageWebsite(session, website.id, website.user_id))) {
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
    const metadataError = videoMetadataError(title, description)
    if (metadataError) return { error: metadataError }
    const videoLink = parseVideoLink(rawUrl)
    if (videoLink.error) return { error: videoLink.error }
    const albumResult = await query("SELECT id, title FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'video' LIMIT 1", [albumId, website.id])
    const album = albumResult.rows[0]
    if (!album) return { error: 'Album video tidak ditemukan.' }
    const client = await pool.connect()
    let item
    try {
      await client.query('BEGIN')
      const result = await client.query("INSERT INTO gallery_items (gallery_album_id, type, path, name, description, created_at, updated_at) VALUES ($1, 'video', $2, $3, $4, NOW(), NOW()) RETURNING id, gallery_album_id, type, path, name, description, created_at", [album.id, videoLink.parsed.toString(), title, description])
      item = result.rows[0]
      await activity(client, session.id, website.id, 'add_video_url', `${website.name}: menambahkan tautan video "${title}" ke album "${album.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    refresh(website.id, album.id)
    return { success: true, message: 'Tautan video berhasil ditambahkan.', item }
  } catch (error) { console.error('Add video URL error:', error); return { error: error.message || 'Gagal menambahkan tautan video.' } }
}

export async function createVideoUploadUrlAction(websiteId, albumId, formData) {
  try {
    const { website } = await authorize(websiteId)
    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim() || null
    const contentType = String(formData.get('content_type') || '')
    const originalName = String(formData.get('file_name') || '').slice(0, 255)
    const size = Number(formData.get('file_size'))
    const error = videoMetadataError(title, description)
    if (error) return { error }
    if (!VIDEO_TYPES.has(contentType)) return { error: 'Format video harus MP4 atau WebM.' }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_SIZE) return { error: 'Ukuran video maksimal 100 MB.' }
    const albumResult = await query("SELECT id FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'video' LIMIT 1", [albumId, website.id])
    if (!albumResult.rows[0]) return { error: 'Album video tidak ditemukan.' }
    const objectPath = `websites/${website.id}/gallery/videos/${album.id}/${randomUUID()}${VIDEO_TYPES.get(contentType)}`
    const signed = await createPortalSignedUploadUrl(objectPath)
    return { success: true, upload: { ...signed, contentType, size, title, description, originalName } }
  } catch (error) {
    console.error('Create video upload URL error:', error)
    return { error: error.message || 'Gagal menyiapkan unggahan video.' }
  }
}

export async function registerUploadedVideoAction(websiteId, albumId, payload) {
  try {
    const { session, website } = await authorize(websiteId)
    const objectPath = String(payload?.path || '')
    const title = String(payload?.title || '').trim()
    const description = String(payload?.description || '').trim() || null
    const contentType = String(payload?.contentType || '')
    const size = Number(payload?.size)
    const error = videoMetadataError(title, description)
    if (error) return { error }
    if (!VIDEO_TYPES.has(contentType) || !Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_SIZE) return { error: 'Data berkas video tidak valid.' }
    const prefix = `websites/${website.id}/gallery/videos/${albumId}/`
    const filename = objectPath.startsWith(prefix) ? objectPath.slice(prefix.length) : ''
    if (!/^[\da-f-]{36}\.(?:mp4|webm)$/i.test(filename)) return { error: 'Lokasi video tidak valid.' }
    const albumResult = await query("SELECT id, title FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'video' LIMIT 1", [albumId, website.id])
    const album = albumResult.rows[0]
    if (!album) return { error: 'Album video tidak ditemukan.' }
    const stored = await getPortalStorageObject(getPortalStorageBucket(), objectPath)
    if (!stored || Number(stored.metadata?.size) !== size || (stored.metadata?.mimetype && stored.metadata.mimetype !== contentType)) return { error: 'Berkas belum selesai diunggah atau metadata video tidak sesuai.' }
    const publicUrl = getPortalPublicUrl(objectPath)
    const client = await pool.connect()
    let item
    try {
      await client.query('BEGIN')
      const inserted = await client.query("INSERT INTO gallery_items (gallery_album_id, type, path, name, description, created_at, updated_at) VALUES ($1, 'video', $2, $3, $4, NOW(), NOW()) RETURNING id, gallery_album_id, type, path, name, description, created_at", [album.id, publicUrl, title, description])
      item = inserted.rows[0]
      await activity(client, session.id, website.id, 'upload_gallery_video', `${website.name}: mengunggah video \"${title}\" ke album \"${album.title}\".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    refresh(website.id, album.id)
    return { success: true, message: 'Video berhasil diunggah.', item }
  } catch (error) {
    console.error('Register uploaded video error:', error)
    return { error: error.message || 'Gagal menyimpan video ke album.' }
  }
}

export async function discardVideoUploadAction(websiteId, albumId, objectPath) {
  try {
    const { website } = await authorize(websiteId)
    const prefix = `websites/${website.id}/gallery/videos/${albumId}/`
    if (typeof objectPath !== 'string' || !objectPath.startsWith(prefix)) return { error: 'Lokasi video tidak valid.' }
    await removePortalFile(`${getPortalStorageBucket()}/${objectPath}`)
    return { success: true }
  } catch (error) {
    console.error('Discard video upload error:', error)
    return { error: error.message || 'Gagal membersihkan unggahan sementara.' }
  }
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
    } else await removePortalFile(item.path).catch((error) => console.warn('Could not remove Supabase video:', error.message))
    refresh(website.id, albumId)
    return { success: true, message: 'Video berhasil dihapus.' }
  } catch (error) { console.error('Delete video item error:', error); return { error: error.message || 'Gagal menghapus video.' } }
}

export async function deleteVideoAlbumAction(websiteId, albumId) {
  try {
    const { session, website } = await authorize(websiteId)
    const client = await pool.connect()
    let title
    let itemsToRemove = []
    let count = 0
    try {
      await client.query('BEGIN')
      const album = await client.query("SELECT id, title FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'video' FOR UPDATE", [albumId, website.id])
      if (!album.rows[0]) throw new Error('Album video tidak ditemukan.')
      title = album.rows[0].title
      const items = await client.query('SELECT path FROM gallery_items WHERE gallery_album_id = $1', [albumId])
      itemsToRemove = items.rows.map((row) => row.path)
      count = itemsToRemove.length
      await client.query('DELETE FROM gallery_albums WHERE id = $1 AND website_id = $2', [albumId, website.id])
      await activity(client, session.id, website.id, 'delete_video_album', `${website.name}: menghapus album video "${title}" beserta ${count} item.`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    const { rm } = await import('node:fs/promises')
    const path = await import('node:path')
    const root = path.resolve(process.cwd(), 'public', 'uploads', 'gallery')
    const dir = path.resolve(root, String(website.id), String(albumId))
    if (dir.startsWith(`${root}${path.sep}`)) await rm(dir, { recursive: true, force: true }).catch((error) => console.warn('Could not remove video directory:', error.message))
    await Promise.all(itemsToRemove.map((file) => removePortalFile(file).catch((error) => console.warn('Could not remove Supabase video:', error.message))))
    refresh(website.id)
    return { success: true, message: `Album video dihapus bersama ${count} item.` }
  } catch (error) { console.error('Delete video album error:', error); return { error: error.message || 'Gagal menghapus album video.' } }
}
