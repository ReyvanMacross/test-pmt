'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import pool, { query } from '@/lib/db'

const CATEGORIES = new Set(['kependudukan', 'sosial', 'perizinan', 'pemerintahan'])

async function authorize(websiteId) {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !access) throw new Error('Sesi berakhir. Silakan masuk kembali.')
  const result = await query('SELECT id, user_id, name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [websiteId])
  const website = result.rows[0]
  if (!website || (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id)) {
    throw new Error('Anda tidak memiliki izin mengelola layanan website ini.')
  }
  return { session, website }
}

function readService(formData) {
  const name = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const requirements = String(formData.get('requirements') || '').trim() || null
  const procedure = String(formData.get('procedure') || '').trim() || null
  const completionTime = String(formData.get('completion_time') || '').trim() || null
  const fee = String(formData.get('fee') || '').trim() || null
  const applicationUrl = String(formData.get('application_url') || '').trim() || null
  if (!name || name.length > 255) throw new Error('Nama layanan wajib diisi, maksimal 255 karakter.')
  if (!CATEGORIES.has(category)) throw new Error('Pilih kategori layanan yang tersedia.')
  if (!description || description.length > 20000) throw new Error('Deskripsi singkat wajib diisi, maksimal 20.000 karakter.')
  if (requirements && requirements.length > 20000) throw new Error('Persyaratan maksimal 20.000 karakter.')
  if (procedure && procedure.length > 20000) throw new Error('Prosedur maksimal 20.000 karakter.')
  if (completionTime && completionTime.length > 150) throw new Error('Waktu penyelesaian maksimal 150 karakter.')
  if (fee && fee.length > 150) throw new Error('Biaya/tarif maksimal 150 karakter.')
  if (applicationUrl) {
    try {
      const parsed = new URL(applicationUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
    } catch { throw new Error('Link aplikasi harus menggunakan URL http:// atau https:// yang valid.') }
    if (applicationUrl.length > 2000) throw new Error('Link aplikasi maksimal 2.000 karakter.')
  }
  return { name, category, description, requirements, procedure, completionTime, fee, applicationUrl }
}

function revalidate(websiteId) {
  revalidatePath(`/admin/network/${websiteId}/content`)
  revalidatePath(`/admin/network/${websiteId}/content/layanan`)
  revalidatePath('/admin/dashboard')
}

async function logActivity(client, userId, websiteId, action, description) {
  await client.query('INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)', [userId, websiteId, action, description])
}

export async function createServiceAction(websiteId, formData) {
  try {
    const { session, website } = await authorize(websiteId)
    const service = readService(formData)
    const client = await pool.connect()
    let created
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `INSERT INTO services (website_id, name, category, description, requirements, procedure, completion_time, fee, application_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, website_id, name, category, description, requirements, procedure, completion_time, fee, application_url, created_at, updated_at`,
        [website.id, service.name, service.category, service.description, service.requirements, service.procedure, service.completionTime, service.fee, service.applicationUrl]
      )
      created = result.rows[0]
      await logActivity(client, session.id, website.id, 'create_service', `${website.name}: menambahkan layanan publik "${service.name}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    revalidate(website.id)
    return { success: true, message: 'Layanan publik berhasil ditambahkan.', service: created }
  } catch (error) { console.error('Create service error:', error); return { error: error.message || 'Gagal menambahkan layanan publik.' } }
}

export async function updateServiceAction(websiteId, serviceId, formData) {
  try {
    const { session, website } = await authorize(websiteId)
    const service = readService(formData)
    const client = await pool.connect()
    let updated
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `UPDATE services SET name = $1, category = $2, description = $3, requirements = $4, procedure = $5,
          completion_time = $6, fee = $7, application_url = $8, updated_at = NOW()
         WHERE id = $9 AND website_id = $10
         RETURNING id, website_id, name, category, description, requirements, procedure, completion_time, fee, application_url, created_at, updated_at`,
        [service.name, service.category, service.description, service.requirements, service.procedure, service.completionTime, service.fee, service.applicationUrl, serviceId, website.id]
      )
      updated = result.rows[0]
      if (!updated) throw new Error('Layanan tidak ditemukan pada website ini.')
      await logActivity(client, session.id, website.id, 'update_service', `${website.name}: memperbarui layanan publik "${service.name}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    revalidate(website.id)
    return { success: true, message: 'Perubahan layanan berhasil disimpan.', service: updated }
  } catch (error) { console.error('Update service error:', error); return { error: error.message || 'Gagal memperbarui layanan publik.' } }
}

export async function deleteServiceAction(websiteId, serviceId) {
  try {
    const { session, website } = await authorize(websiteId)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query('DELETE FROM services WHERE id = $1 AND website_id = $2 RETURNING name', [serviceId, website.id])
      if (!result.rows[0]) throw new Error('Layanan tidak ditemukan pada website ini.')
      await logActivity(client, session.id, website.id, 'delete_service', `${website.name}: menghapus layanan publik "${result.rows[0].name}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    revalidate(website.id)
    return { success: true, message: 'Layanan publik berhasil dihapus.' }
  } catch (error) { console.error('Delete service error:', error); return { error: error.message || 'Gagal menghapus layanan publik.' } }
}
