'use server'


import { canManageWebsite } from '@/lib/website-access'
import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import pool, { query } from '@/lib/db'
import { removePortalFile, uploadPortalFile } from '@/lib/storage'

const MAX_COVER_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

async function authorize(websiteId) {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !access) throw new Error('Sesi berakhir. Silakan masuk kembali.')
  const result = await query('SELECT id, user_id, name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [websiteId])
  const website = result.rows[0]
  if (!website || !(await canManageWebsite(session, website.id, website.user_id))) {
    throw new Error('Anda tidak memiliki izin mengelola inovasi website ini.')
  }
  return { session, website }
}

function optionalHttpUrl(rawValue, label) {
  const value = rawValue?.trim()
  if (!value) return null
  let parsed
  try { parsed = new URL(value) } catch { throw new Error(`${label} harus berupa URL yang valid.`) }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${label} harus menggunakan http atau https.`)
  return parsed.toString()
}

function readForm(formData) {
  const title = formData.get('title')?.trim()
  const description = formData.get('description')?.trim()
  const rawYear = formData.get('launch_year')?.trim()
  const launchYear = rawYear ? Number(rawYear) : null
  if (!title || title.length > 255) throw new Error('Nama inovasi wajib diisi, maksimal 255 karakter.')
  if (!description || description.length > 50000) throw new Error('Ringkasan inovasi wajib diisi, maksimal 50.000 karakter.')
  if (launchYear !== null && (!Number.isInteger(launchYear) || launchYear < 1990 || launchYear > 2099)) throw new Error('Tahun peluncuran harus antara 1990 dan 2099.')
  return {
    title,
    description,
    launchYear,
    applicationUrl: optionalHttpUrl(formData.get('application_url'), 'Link aplikasi/website'),
    videoUrl: optionalHttpUrl(formData.get('video_url'), 'Link video/profil'),
  }
}

async function prepareCover(file, websiteId) {
  if (!file) return null
  if (typeof file.arrayBuffer !== 'function') throw new Error('Berkas cover tidak valid.')
  if (file.size <= 0) return null
  if (file.size > MAX_COVER_SIZE) throw new Error('Ukuran gambar cover maksimal 5 MB.')
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) throw new Error('Cover harus berupa gambar JPG, PNG, WebP, atau GIF.')
  const buffer = Buffer.from(await file.arrayBuffer())
  let extension = null
  if (file.type === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) extension = '.jpg'
  if (file.type === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = '.png'
  if (file.type === 'image/webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') extension = '.webp'
  if (file.type === 'image/gif' && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) extension = '.gif'
  if (!extension) throw new Error('Isi berkas tidak sesuai dengan format gambar yang dipilih.')
  const filename = `${randomUUID()}${extension}`
  const uploaded = await uploadPortalFile({ file, objectPath: `websites/${websiteId}/innovations/${filename}` })
  return { publicPath: uploaded.publicUrl, name: String(file.name || filename).slice(0, 255), type: file.type, size: file.size }
}

function revalidate(websiteId) {
  revalidatePath(`/admin/network/${websiteId}/content`)
  revalidatePath(`/admin/network/${websiteId}/content/inovasi`)
  revalidatePath('/admin/dashboard')
}

async function logActivity(client, sessionId, websiteId, action, description) {
  await client.query('INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)', [sessionId, websiteId, action, description])
}

export async function createInnovationAction(websiteId, formData) {
  let cover
  try {
    const { session, website } = await authorize(websiteId)
    const input = readForm(formData)
    cover = await prepareCover(formData.get('cover'), website.id)
    const client = await pool.connect()
    let innovation
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `INSERT INTO innovations (website_id, title, description, launch_year, application_url, video_url, cover_path, cover_name, cover_type, cover_size, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id, title, description, launch_year, application_url, video_url, cover_path, cover_name, cover_type, cover_size, created_at, updated_at`,
        [website.id, input.title, input.description, input.launchYear, input.applicationUrl, input.videoUrl, cover?.publicPath || null, cover?.name || null, cover?.type || null, cover?.size || null]
      )
      innovation = result.rows[0]
      await logActivity(client, session.id, website.id, 'create_innovation', `${website.name}: menerbitkan inovasi "${input.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    revalidate(website.id)
    return { success: true, message: 'Inovasi berhasil diterbitkan.', innovation }
  } catch (error) {
    if (cover?.publicPath) await removePortalFile(cover.publicPath).catch(() => {})
    console.error('Create innovation error:', error)
    return { error: error.message || 'Gagal membuat data inovasi.' }
  }
}

export async function updateInnovationAction(websiteId, innovationId, formData) {
  let cover
  let oldCoverPath = null
  try {
    const { session, website } = await authorize(websiteId)
    const input = readForm(formData)
    cover = await prepareCover(formData.get('cover'), website.id)
    const removeCover = formData.get('remove_cover') === 'true'
    const client = await pool.connect()
    let innovation
    try {
      await client.query('BEGIN')
      const existing = await client.query('SELECT id, cover_path FROM innovations WHERE id = $1 AND website_id = $2 FOR UPDATE', [innovationId, website.id])
      if (!existing.rows[0]) throw new Error('Data inovasi tidak ditemukan pada website ini.')
      oldCoverPath = (cover || removeCover) ? existing.rows[0].cover_path : null
      const result = await client.query(
        `UPDATE innovations SET title = $1, description = $2, launch_year = $3, application_url = $4, video_url = $5,
           cover_path = CASE WHEN $6::boolean THEN $7 ELSE cover_path END,
           cover_name = CASE WHEN $6::boolean THEN $8 ELSE cover_name END,
           cover_type = CASE WHEN $6::boolean THEN $9 ELSE cover_type END,
           cover_size = CASE WHEN $6::boolean THEN $10 ELSE cover_size END,
           updated_at = NOW() WHERE id = $11 AND website_id = $12
         RETURNING id, title, description, launch_year, application_url, video_url, cover_path, cover_name, cover_type, cover_size, created_at, updated_at`,
        [input.title, input.description, input.launchYear, input.applicationUrl, input.videoUrl, Boolean(cover || removeCover), cover?.publicPath || null, cover?.name || null, cover?.type || null, cover?.size || null, innovationId, website.id]
      )
      innovation = result.rows[0]
      await logActivity(client, session.id, website.id, 'update_innovation', `${website.name}: memperbarui inovasi "${input.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    if (oldCoverPath) {
      if (await removePortalFile(oldCoverPath).catch(() => false)) {
        // Previous Supabase Storage object removed.
      } else {
      const oldFile = path.resolve(process.cwd(), 'public', oldCoverPath.replace(/^\//, ''))
      const root = path.resolve(process.cwd(), 'public', 'uploads', 'innovations', String(website.id))
      if (oldFile.startsWith(`${root}${path.sep}`)) await unlink(oldFile).catch((error) => console.warn('Could not remove old innovation cover:', error.message))
      }
    }
    revalidate(website.id)
    return { success: true, message: 'Perubahan inovasi berhasil disimpan.', innovation }
  } catch (error) {
    if (cover?.publicPath) await removePortalFile(cover.publicPath).catch(() => {})
    console.error('Update innovation error:', error)
    return { error: error.message || 'Gagal memperbarui inovasi.' }
  }
}

export async function deleteInnovationAction(websiteId, innovationId) {
  try {
    const { session, website } = await authorize(websiteId)
    const client = await pool.connect()
    let deleted
    try {
      await client.query('BEGIN')
      const result = await client.query('DELETE FROM innovations WHERE id = $1 AND website_id = $2 RETURNING title, cover_path', [innovationId, website.id])
      deleted = result.rows[0]
      if (!deleted) throw new Error('Data inovasi tidak ditemukan pada website ini.')
      await logActivity(client, session.id, website.id, 'delete_innovation', `${website.name}: menghapus inovasi "${deleted.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    if (deleted.cover_path) {
      if (await removePortalFile(deleted.cover_path).catch(() => false)) {
        // Supabase Storage object removed.
      } else {
      const file = path.resolve(process.cwd(), 'public', deleted.cover_path.replace(/^\//, ''))
      const root = path.resolve(process.cwd(), 'public', 'uploads', 'innovations', String(website.id))
      if (file.startsWith(`${root}${path.sep}`)) await unlink(file).catch((error) => console.warn('Could not remove innovation cover:', error.message))
      }
    }
    revalidate(website.id)
    return { success: true, message: 'Inovasi berhasil dihapus.' }
  } catch (error) {
    console.error('Delete innovation error:', error)
    return { error: error.message || 'Gagal menghapus inovasi.' }
  }
}
