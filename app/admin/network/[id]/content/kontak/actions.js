'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import pool, { query } from '@/lib/db'

const fields = {
  contact_address: ['Alamat kantor', 10000],
  operating_hours: ['Jam operasional', 5000],
  office_phone: ['Nomor telepon', 100],
  whatsapp_phone: ['Nomor WhatsApp', 100],
  official_email: ['Email resmi', 255],
  google_maps_url: ['Link Google Maps', 2000],
  instagram_username: ['Username Instagram', 255],
  facebook_page_name: ['Nama halaman Facebook', 255],
  youtube_channel_url: ['Link kanal YouTube', 2000],
}

async function authorize(websiteId) {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !access) throw new Error('Sesi berakhir. Silakan masuk kembali.')
  const result = await query('SELECT id, user_id, name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [websiteId])
  const website = result.rows[0]
  if (!website || (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id)) {
    throw new Error('Anda tidak memiliki izin mengelola kontak website ini.')
  }
  return { session, website }
}

function readContact(formData) {
  const contact = {}
  for (const [key, [label, maxLength]] of Object.entries(fields)) {
    const value = String(formData.get(key) || '').trim()
    if (value.length > maxLength) throw new Error(`${label} maksimal ${maxLength} karakter.`)
    contact[key] = value || null
  }
  if (contact.official_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.official_email)) {
    throw new Error('Format email resmi tidak valid.')
  }
  for (const key of ['google_maps_url', 'youtube_channel_url']) {
    const value = contact[key]
    if (!value) continue
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    } catch { throw new Error(`${fields[key][0]} harus menggunakan URL http:// atau https:// yang valid.`) }
  }
  return contact
}

export async function saveContactAction(websiteId, formData) {
  try {
    const { session, website } = await authorize(websiteId)
    const contact = readContact(formData)
    const columns = Object.keys(fields)
    const values = columns.map((column) => contact[column])
    const placeholders = values.map((_, index) => `$${index + 2}`).join(', ')
    const updates = columns.map((column) => `${column} = EXCLUDED.${column}`).join(', ')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO wilayah_profiles (website_id, ${columns.join(', ')}, updated_at)
         VALUES ($1, ${placeholders}, NOW())
         ON CONFLICT (website_id) DO UPDATE SET ${updates}, updated_at = NOW()`,
        [website.id, ...values]
      )
      await client.query(
        'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
        [session.id, website.id, 'update_content', `${website.name}: memperbarui informasi kontak dan media sosial instansi.`]
      )
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
    revalidatePath(`/admin/network/${website.id}/content`)
    revalidatePath(`/admin/network/${website.id}/content/kontak`)
    revalidatePath('/admin/dashboard')
    return { success: true, message: 'Informasi kontak berhasil disimpan.' }
  } catch (error) {
    console.error('Save contact information error:', error)
    return { error: error.message || 'Gagal menyimpan informasi kontak.' }
  }
}
