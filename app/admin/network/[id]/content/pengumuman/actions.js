'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import pool, { query } from '@/lib/db'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'])

async function authorize(websiteId) {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !access) throw new Error('Sesi berakhir. Silakan masuk kembali.')
  const result = await query('SELECT id, user_id, name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [websiteId])
  const website = result.rows[0]
  if (!website || (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id)) {
    throw new Error('Anda tidak memiliki izin mengelola pengumuman website ini.')
  }
  return { session, website }
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function identifyAttachment(buffer, mimeType) {
  if (mimeType === 'application/pdf' && buffer.subarray(0, 5).toString('ascii') === '%PDF-') return '.pdf'
  if (mimeType === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg'
  if (mimeType === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png'
  if (mimeType === 'image/webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp'
  if (mimeType === 'image/gif' && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return '.gif'
  return null
}

async function prepareAttachment(file, websiteId) {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size <= 0) return null
  if (file.size > MAX_FILE_SIZE) throw new Error('Ukuran lampiran maksimal 5 MB.')
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Lampiran hanya mendukung PDF, JPG, PNG, WebP, atau GIF.')
  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = identifyAttachment(buffer, file.type)
  if (!extension) throw new Error('Isi berkas tidak sesuai dengan format lampiran yang dipilih.')
  const fileName = `${randomUUID()}${extension}`
  const directory = path.join(process.cwd(), 'public', 'uploads', 'announcements', String(websiteId))
  await mkdir(directory, { recursive: true })
  const absolutePath = path.join(directory, fileName)
  const publicPath = `/uploads/announcements/${websiteId}/${fileName}`
  await writeFile(absolutePath, buffer, { flag: 'wx' })
  return { absolutePath, publicPath, originalName: String(file.name || fileName).slice(0, 255), mimeType: file.type, size: file.size }
}

function refresh(websiteId) {
  revalidatePath(`/admin/network/${websiteId}/content`)
  revalidatePath(`/admin/network/${websiteId}/content/pengumuman`)
  revalidatePath('/admin/dashboard')
}

async function logActivity(client, sessionId, websiteId, action, description) {
  await client.query('INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)', [sessionId, websiteId, action, description])
}

function readAnnouncementForm(formData) {
  const title = formData.get('title')?.trim()
  const body = formData.get('body')?.trim()
  const publishDate = formData.get('publish_date')
  const expiresAt = formData.get('expires_at') || null
  if (!title || title.length > 255) throw new Error('Judul pengumuman wajib diisi, maksimal 255 karakter.')
  if (!body || body.length > 50000) throw new Error('Isi pengumuman wajib diisi, maksimal 50.000 karakter.')
  if (!validDate(publishDate)) throw new Error('Tanggal terbit wajib diisi dengan tanggal yang valid.')
  if (expiresAt && !validDate(expiresAt)) throw new Error('Tanggal kedaluwarsa tidak valid.')
  if (expiresAt && expiresAt < publishDate) throw new Error('Tanggal kedaluwarsa harus sama dengan atau setelah tanggal terbit.')
  return { title, body, publishDate, expiresAt }
}

export async function createAnnouncementAction(websiteId, formData) {
  let attachment
  try {
    const { session, website } = await authorize(websiteId)
    const input = readAnnouncementForm(formData)
    attachment = await prepareAttachment(formData.get('attachment'), website.id)
    const client = await pool.connect()
    let announcement
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `INSERT INTO announcements (website_id, title, body, publish_date, expires_at, attachment_path, attachment_name, attachment_type, attachment_size, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING id, title, body, publish_date, expires_at, attachment_path, attachment_name, attachment_type, attachment_size, created_at, updated_at`,
        [website.id, input.title, input.body, input.publishDate, input.expiresAt, attachment?.publicPath || null, attachment?.originalName || null, attachment?.mimeType || null, attachment?.size || null]
      )
      announcement = result.rows[0]
      await logActivity(client, session.id, website.id, 'create_announcement', `${website.name}: menerbitkan pengumuman "${input.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    refresh(website.id)
    return { success: true, message: 'Pengumuman berhasil diterbitkan.', announcement }
  } catch (error) {
    if (attachment?.absolutePath) await unlink(attachment.absolutePath).catch(() => {})
    console.error('Create announcement error:', error)
    return { error: error.message || 'Gagal membuat pengumuman.' }
  }
}

export async function updateAnnouncementAction(websiteId, announcementId, formData) {
  let attachment
  let oldAttachmentPath = null
  let announcement
  try {
    const { session, website } = await authorize(websiteId)
    const input = readAnnouncementForm(formData)
    attachment = await prepareAttachment(formData.get('attachment'), website.id)
    const removeAttachment = formData.get('remove_attachment') === 'true'
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const existing = await client.query('SELECT id, title, attachment_path FROM announcements WHERE id = $1 AND website_id = $2 FOR UPDATE', [announcementId, website.id])
      if (!existing.rows[0]) throw new Error('Pengumuman tidak ditemukan pada website ini.')
      oldAttachmentPath = (attachment || removeAttachment) ? existing.rows[0].attachment_path : null
      const result = await client.query(
        `UPDATE announcements SET title = $1, body = $2, publish_date = $3, expires_at = $4,
           attachment_path = CASE WHEN $5::boolean THEN $6 ELSE attachment_path END,
           attachment_name = CASE WHEN $5::boolean THEN $7 ELSE attachment_name END,
           attachment_type = CASE WHEN $5::boolean THEN $8 ELSE attachment_type END,
           attachment_size = CASE WHEN $5::boolean THEN $9 ELSE attachment_size END,
           updated_at = NOW()
         WHERE id = $10 AND website_id = $11
         RETURNING id, title, body, publish_date, expires_at, attachment_path, attachment_name, attachment_type, attachment_size, created_at, updated_at`,
        [input.title, input.body, input.publishDate, input.expiresAt, Boolean(attachment || removeAttachment), attachment?.publicPath || null, attachment?.originalName || null, attachment?.mimeType || null, attachment?.size || null, announcementId, website.id]
      )
      await logActivity(client, session.id, website.id, 'update_announcement', `${website.name}: memperbarui pengumuman "${input.title}".`)
      await client.query('COMMIT')
      announcement = result.rows[0]
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    if (oldAttachmentPath) {
      const oldFile = path.resolve(process.cwd(), 'public', oldAttachmentPath.replace(/^\//, ''))
      const root = path.resolve(process.cwd(), 'public', 'uploads', 'announcements', String(website.id))
      if (oldFile.startsWith(`${root}${path.sep}`)) await unlink(oldFile).catch((error) => console.warn('Could not remove old announcement attachment:', error.message))
    }
    refresh(website.id)
    return { success: true, message: 'Perubahan pengumuman berhasil disimpan.', announcement }
  } catch (error) {
    if (attachment?.absolutePath) await unlink(attachment.absolutePath).catch(() => {})
    console.error('Update announcement error:', error)
    return { error: error.message || 'Gagal memperbarui pengumuman.' }
  }
}

export async function deleteAnnouncementAction(websiteId, announcementId) {
  try {
    const { session, website } = await authorize(websiteId)
    const client = await pool.connect()
    let deleted
    try {
      await client.query('BEGIN')
      const result = await client.query('DELETE FROM announcements WHERE id = $1 AND website_id = $2 RETURNING title, attachment_path', [announcementId, website.id])
      deleted = result.rows[0]
      if (!deleted) throw new Error('Pengumuman tidak ditemukan pada website ini.')
      await logActivity(client, session.id, website.id, 'delete_announcement', `${website.name}: menghapus pengumuman "${deleted.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    if (deleted.attachment_path) {
      const file = path.resolve(process.cwd(), 'public', deleted.attachment_path.replace(/^\//, ''))
      const root = path.resolve(process.cwd(), 'public', 'uploads', 'announcements', String(website.id))
      if (file.startsWith(`${root}${path.sep}`)) await unlink(file).catch((error) => console.warn('Could not remove announcement attachment:', error.message))
    }
    refresh(website.id)
    return { success: true, message: 'Pengumuman berhasil dihapus.' }
  } catch (error) {
    console.error('Delete announcement error:', error)
    return { error: error.message || 'Gagal menghapus pengumuman.' }
  }
}
