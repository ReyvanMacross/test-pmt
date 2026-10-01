'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import pool, { query } from '@/lib/db'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024

async function authorizeGalleryWebsite(websiteId) {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !access) throw new Error('Sesi berakhir. Silakan masuk kembali.')

  const result = await query(
    'SELECT id, user_id, name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [websiteId]
  )
  const website = result.rows[0]
  const hasGlobalAccess = hasAdminPermission(access, 'manage-all-websites')
  const hasAssignedAccess = hasAdminPermission(access, 'manage-assigned-website')
  if (!website || (!hasGlobalAccess && (!hasAssignedAccess || website.user_id !== session.id))) {
    throw new Error('Anda tidak memiliki izin mengelola galeri website ini.')
  }
  return { session, website }
}

function revalidateGallery(websiteId, albumId) {
  revalidatePath(`/admin/network/${websiteId}/content`)
  revalidatePath(`/admin/network/${websiteId}/content/galeri-gambar`)
  if (albumId) revalidatePath(`/admin/network/${websiteId}/content/galeri-gambar/${albumId}`)
}

function publicUploadPath(websiteId, albumId, fileName) {
  return `/uploads/gallery/${websiteId}/${albumId}/${fileName}`
}

function localPathFromPublicPath(publicPath) {
  if (typeof publicPath !== 'string' || !publicPath.startsWith('/uploads/gallery/')) return null
  const root = path.resolve(process.cwd(), 'public', 'uploads', 'gallery')
  const target = path.resolve(process.cwd(), 'public', publicPath.slice(1))
  if (!target.startsWith(`${root}${path.sep}`)) return null
  return target
}

function identifyImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp'
  return null
}

async function recordActivity(client, sessionId, websiteId, action, description) {
  await client.query(
    'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
    [sessionId, websiteId, action, description]
  )
}

export async function createGalleryAlbumAction(websiteId, formData) {
  try {
    const { session, website } = await authorizeGalleryWebsite(websiteId)
    const title = formData.get('title')?.trim()
    const albumDate = formData.get('album_date')
    if (!title || title.length > 255) return { error: 'Nama album wajib diisi, maksimal 255 karakter.' }
    if (!albumDate || !/^\d{4}-\d{2}-\d{2}$/.test(albumDate) || Number.isNaN(Date.parse(`${albumDate}T00:00:00Z`))) {
      return { error: 'Tanggal kegiatan wajib diisi dengan tanggal yang valid.' }
    }

    const client = await pool.connect()
    let album
    try {
      await client.query('BEGIN')
      const inserted = await client.query(
        `INSERT INTO gallery_albums (website_id, type, title, album_date, created_at, updated_at)
         VALUES ($1, 'image', $2, $3, NOW(), NOW()) RETURNING id, title, album_date, created_at`,
        [website.id, title, albumDate]
      )
      album = inserted.rows[0]
      await recordActivity(client, session.id, website.id, 'create_gallery_album', `${website.name}: membuat album gambar "${title}".`)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    revalidateGallery(website.id)
    return { success: true, message: `Album "${album.title}" berhasil dibuat.`, album: { ...album, item_count: 0, cover_path: null } }
  } catch (error) {
    console.error('Create gallery album error:', error)
    return { error: error.message || 'Gagal membuat album gambar.' }
  }
}

export async function updateGalleryAlbumAction(websiteId, albumId, formData) {
  try {
    const { session, website } = await authorizeGalleryWebsite(websiteId)
    const title = formData.get('title')?.trim()
    const albumDate = formData.get('album_date')
    if (!title || title.length > 255) return { error: 'Nama album wajib diisi, maksimal 255 karakter.' }
    if (!albumDate || !/^\d{4}-\d{2}-\d{2}$/.test(albumDate) || Number.isNaN(Date.parse(`${albumDate}T00:00:00Z`))) {
      return { error: 'Tanggal kegiatan wajib diisi dengan tanggal yang valid.' }
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const updated = await client.query(
        `UPDATE gallery_albums SET title = $1, album_date = $2, updated_at = NOW()
         WHERE id = $3 AND website_id = $4 AND type = 'image' RETURNING title`,
        [title, albumDate, albumId, website.id]
      )
      if (!updated.rows[0]) throw new Error('Album tidak ditemukan pada website ini.')
      await recordActivity(client, session.id, website.id, 'update_gallery_album', `${website.name}: memperbarui album gambar "${updated.rows[0].title}".`)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    revalidateGallery(website.id, albumId)
    return { success: true, message: 'Informasi album berhasil disimpan.' }
  } catch (error) {
    console.error('Update gallery album error:', error)
    return { error: error.message || 'Gagal memperbarui album.' }
  }
}

export async function uploadGalleryItemAction(websiteId, albumId, formData) {
  let savedPath
  try {
    const { session, website } = await authorizeGalleryWebsite(websiteId)
    const file = formData.get('file')
    const title = formData.get('title')?.trim()
    const description = formData.get('description')?.trim() || null
    if (!file || typeof file.arrayBuffer !== 'function' || file.size <= 0) return { error: 'Pilih berkas foto terlebih dahulu.' }
    if (file.size > MAX_IMAGE_SIZE) return { error: 'Ukuran foto maksimal 2 MB.' }
    if (!title || title.length > 255) return { error: 'Judul foto wajib diisi, maksimal 255 karakter.' }
    if (description && description.length > 5000) return { error: 'Deskripsi foto maksimal 5.000 karakter.' }

    const albumCheck = await query(
      `SELECT id, title FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'image' LIMIT 1`,
      [albumId, website.id]
    )
    const album = albumCheck.rows[0]
    if (!album) return { error: 'Album gambar tidak ditemukan pada website ini.' }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = identifyImage(buffer)
    if (!extension) return { error: 'Format foto harus JPG, PNG, atau WebP.' }
    const fileName = `${randomUUID()}${extension}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'gallery', String(website.id), String(album.id))
    await mkdir(uploadDir, { recursive: true })
    const localFilePath = path.join(uploadDir, fileName)
    savedPath = publicUploadPath(website.id, album.id, fileName)
    await writeFile(localFilePath, buffer, { flag: 'wx' })

    const client = await pool.connect()
    let item
    try {
      await client.query('BEGIN')
      const inserted = await client.query(
        `INSERT INTO gallery_items (gallery_album_id, type, path, name, description, created_at, updated_at)
         VALUES ($1, 'image', $2, $3, $4, NOW(), NOW())
         RETURNING id, gallery_album_id, type, path, name, description, created_at, updated_at`,
        [album.id, savedPath, title, description]
      )
      item = inserted.rows[0]
      await recordActivity(client, session.id, website.id, 'upload_gallery_image', `${website.name}: mengunggah foto "${title}" ke album "${album.title}".`)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    revalidateGallery(website.id, album.id)
    return { success: true, message: 'Foto berhasil diunggah.', item }
  } catch (error) {
    if (savedPath) {
      const localFilePath = localPathFromPublicPath(savedPath)
      if (localFilePath) await unlink(localFilePath).catch(() => {})
    }
    console.error('Upload gallery image error:', error)
    return { error: error.message || 'Gagal mengunggah foto.' }
  }
}

export async function deleteGalleryItemAction(websiteId, albumId, itemId) {
  let removedPath
  try {
    const { session, website } = await authorizeGalleryWebsite(websiteId)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const deleted = await client.query(
        `DELETE FROM gallery_items gi USING gallery_albums ga
         WHERE gi.id = $1 AND gi.gallery_album_id = ga.id AND ga.id = $2 AND ga.website_id = $3
         RETURNING gi.path, gi.name, ga.title AS album_title`,
        [itemId, albumId, website.id]
      )
      if (!deleted.rows[0]) throw new Error('Foto tidak ditemukan di dalam album ini.')
      removedPath = deleted.rows[0].path
      await recordActivity(client, session.id, website.id, 'delete_gallery_image', `${website.name}: menghapus foto "${deleted.rows[0].name || 'Tanpa judul'}" dari album "${deleted.rows[0].album_title}".`)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    const localFilePath = localPathFromPublicPath(removedPath)
    if (localFilePath) await unlink(localFilePath).catch((error) => console.warn('Could not remove gallery file:', error.message))
    revalidateGallery(website.id, albumId)
    return { success: true, message: 'Foto berhasil dihapus.' }
  } catch (error) {
    console.error('Delete gallery image error:', error)
    return { error: error.message || 'Gagal menghapus foto.' }
  }
}

export async function deleteGalleryAlbumAction(websiteId, albumId) {
  let photos = []
  try {
    const { session, website } = await authorizeGalleryWebsite(websiteId)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const albumResult = await client.query(
        `SELECT id, title FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'image' FOR UPDATE`,
        [albumId, website.id]
      )
      const album = albumResult.rows[0]
      if (!album) throw new Error('Album tidak ditemukan pada website ini.')
      const items = await client.query('SELECT path FROM gallery_items WHERE gallery_album_id = $1', [album.id])
      photos = items.rows.map((row) => row.path)
      await client.query('DELETE FROM gallery_albums WHERE id = $1 AND website_id = $2', [album.id, website.id])
      await recordActivity(client, session.id, website.id, 'delete_gallery_album', `${website.name}: menghapus album gambar "${album.title}" beserta ${photos.length} foto.`)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    const albumDirectory = path.resolve(process.cwd(), 'public', 'uploads', 'gallery', String(website.id), String(albumId))
    const galleryRoot = path.resolve(process.cwd(), 'public', 'uploads', 'gallery')
    if (albumDirectory.startsWith(`${galleryRoot}${path.sep}`)) await rm(albumDirectory, { recursive: true, force: true }).catch((error) => console.warn('Could not remove gallery directory:', error.message))
    revalidateGallery(website.id)
    return { success: true, message: `Album berhasil dihapus beserta ${photos.length} foto.` }
  } catch (error) {
    console.error('Delete gallery album error:', error)
    return { error: error.message || 'Gagal menghapus album.' }
  }
}
