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
    throw new Error('Anda tidak memiliki izin mengelola agenda website ini.')
  }
  return { session, website }
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function readAgenda(formData) {
  const title = formData.get('title')?.trim()
  const description = formData.get('description')?.trim()
  const startDate = formData.get('start_date')
  const endDate = formData.get('end_date')
  const timeRange = formData.get('time_range')?.trim() || null
  const location = formData.get('location')?.trim() || null
  const organizer = formData.get('organizer')?.trim() || null
  if (!title || title.length > 255) throw new Error('Nama agenda wajib diisi, maksimal 255 karakter.')
  if (!description || description.length > 50000) throw new Error('Deskripsi agenda wajib diisi, maksimal 50.000 karakter.')
  if (!isValidDate(startDate) || !isValidDate(endDate)) throw new Error('Tanggal mulai dan selesai wajib diisi dengan tanggal yang valid.')
  if (endDate < startDate) throw new Error('Tanggal selesai harus sama dengan atau setelah tanggal mulai.')
  if (timeRange && timeRange.length > 100) throw new Error('Waktu pelaksanaan maksimal 100 karakter.')
  if (location && location.length > 500) throw new Error('Lokasi maksimal 500 karakter.')
  if (organizer && organizer.length > 255) throw new Error('Penyelenggara maksimal 255 karakter.')
  return { title, description, startDate, endDate, timeRange, location, organizer }
}

function revalidate(websiteId) {
  revalidatePath(`/admin/network/${websiteId}/content`)
  revalidatePath(`/admin/network/${websiteId}/content/agenda-kegiatan`)
  revalidatePath('/admin/dashboard')
}

async function logActivity(client, sessionId, websiteId, action, description) {
  await client.query('INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)', [sessionId, websiteId, action, description])
}

export async function createAgendaAction(websiteId, formData) {
  try {
    const { session, website } = await authorize(websiteId)
    const agenda = readAgenda(formData)
    const client = await pool.connect()
    let created
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `INSERT INTO agendas (website_id, title, description, start_date, end_date, time_range, location, organizer, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id, title, description, start_date, end_date, time_range, location, organizer, created_at, updated_at`,
        [website.id, agenda.title, agenda.description, agenda.startDate, agenda.endDate, agenda.timeRange, agenda.location, agenda.organizer]
      )
      created = result.rows[0]
      await logActivity(client, session.id, website.id, 'create_agenda', `${website.name}: menjadwalkan agenda "${agenda.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    revalidate(website.id)
    return { success: true, message: 'Agenda berhasil dijadwalkan.', agenda: created }
  } catch (error) { console.error('Create agenda error:', error); return { error: error.message || 'Gagal membuat agenda.' } }
}

export async function updateAgendaAction(websiteId, agendaId, formData) {
  try {
    const { session, website } = await authorize(websiteId)
    const agenda = readAgenda(formData)
    const client = await pool.connect()
    let updated
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `UPDATE agendas SET title = $1, description = $2, start_date = $3, end_date = $4, time_range = $5, location = $6, organizer = $7, updated_at = NOW()
         WHERE id = $8 AND website_id = $9
         RETURNING id, title, description, start_date, end_date, time_range, location, organizer, created_at, updated_at`,
        [agenda.title, agenda.description, agenda.startDate, agenda.endDate, agenda.timeRange, agenda.location, agenda.organizer, agendaId, website.id]
      )
      updated = result.rows[0]
      if (!updated) throw new Error('Agenda tidak ditemukan pada website ini.')
      await logActivity(client, session.id, website.id, 'update_agenda', `${website.name}: memperbarui agenda "${agenda.title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    revalidate(website.id)
    return { success: true, message: 'Perubahan agenda berhasil disimpan.', agenda: updated }
  } catch (error) { console.error('Update agenda error:', error); return { error: error.message || 'Gagal memperbarui agenda.' } }
}

export async function deleteAgendaAction(websiteId, agendaId) {
  try {
    const { session, website } = await authorize(websiteId)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query('DELETE FROM agendas WHERE id = $1 AND website_id = $2 RETURNING title', [agendaId, website.id])
      if (!result.rows[0]) throw new Error('Agenda tidak ditemukan pada website ini.')
      await logActivity(client, session.id, website.id, 'delete_agenda', `${website.name}: menghapus agenda "${result.rows[0].title}".`)
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    revalidate(website.id)
    return { success: true, message: 'Agenda berhasil dihapus.' }
  } catch (error) { console.error('Delete agenda error:', error); return { error: error.message || 'Gagal menghapus agenda.' } }
}
