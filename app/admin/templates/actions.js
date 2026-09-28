'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

// ─── 1. BUAT TEMPLATE BARU ────────────────────────────────────────────────────
export async function createTemplateAction(formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'super-admin') {
    return { error: 'Hanya Super Administrator yang dapat menambahkan template baru.' }
  }

  const name = (formData.get('nama_template') || formData.get('name'))?.trim()
  let slug = (formData.get('slug_identifier') || formData.get('slug'))?.trim()?.toLowerCase()
  const description = (formData.get('deskripsi') || formData.get('description'))?.trim() || null
  const status = formData.get('status_default') || formData.get('status')
  const isActive = status?.toLowerCase() === 'aktif' || status === 'true'

  if (!name) {
    return { error: 'Nama template wajib diisi.' }
  }

  // Jika slug kosong, buat dari nama
  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  try {
    // Cek keunikan slug
    const checkSlug = await query('SELECT id FROM templates WHERE slug = $1 LIMIT 1', [slug])
    if (checkSlug.rows.length > 0) {
      return { error: `Slug "${slug}" sudah digunakan oleh template lain.` }
    }

    const insertRes = await query(
      `INSERT INTO templates (name, slug, description, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name`,
      [name, slug, description, isActive]
    )

    // Catat log aktivitas
    await query(
      `INSERT INTO activity_logs (user_id, action, description)
       VALUES ($1, 'create_template', $2)`,
      [session.id, `Menambahkan template baru: ${name} (slug: ${slug})`]
    )

    revalidatePath('/admin/templates')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/network')

    return { success: true, id: insertRes.rows[0].id }
  } catch (err) {
    console.error('Error creating template:', err)
    return { error: 'Gagal membuat template baru. Terjadi kesalahan pada server.' }
  }
}

// ─── 2. PERBARUI TEMPLATE ─────────────────────────────────────────────────────
export async function updateTemplateAction(formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'super-admin') {
    return { error: 'Hanya Super Administrator yang dapat mengedit template.' }
  }

  const id = formData.get('id')
  const name = formData.get('name')?.trim()
  const description = formData.get('description')?.trim() || null
  const status = formData.get('status')
  const isActive = status === 'aktif' || status === 'true'

  if (!id || !name) {
    return { error: 'ID dan nama template wajib diisi.' }
  }

  try {
    const updateRes = await query(
      `UPDATE templates
       SET name = $1, description = $2, is_active = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, slug`,
      [name, description, isActive, id]
    )

    if (updateRes.rows.length === 0) {
      return { error: 'Template tidak ditemukan.' }
    }

    const tpl = updateRes.rows[0]

    // Catat log aktivitas
    await query(
      `INSERT INTO activity_logs (user_id, action, description)
       VALUES ($1, 'update_template', $2)`,
      [session.id, `Memperbarui template: ${tpl.name} (${tpl.slug})`]
    )

    revalidatePath('/admin/templates')
    revalidatePath(`/admin/templates/${id}/edit`)
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/network')

    return { success: true }
  } catch (err) {
    console.error('Error updating template:', err)
    return { error: 'Gagal memperbarui template. Terjadi kesalahan pada server.' }
  }
}

// ─── 3. HAPUS TEMPLATE ────────────────────────────────────────────────────────
export async function deleteTemplateAction(formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'super-admin') {
    return { error: 'Hanya Super Administrator yang dapat menghapus template.' }
  }

  const id = formData.get('id')
  if (!id) return { error: 'ID template tidak valid.' }

  try {
    // 1. Cek apakah ada website aktif yang menggunakan template ini
    const usageCheck = await query(
      'SELECT COUNT(*) FROM websites WHERE template_id = $1 AND deleted_at IS NULL',
      [id]
    )
    const usageCount = parseInt(usageCheck.rows[0].count, 10)

    if (usageCount > 0) {
      return {
        error: `Template sedang digunakan oleh ${usageCount} website aktif dan tidak dapat dihapus.`,
      }
    }

    // 2. Ambil nama template untuk log
    const tplRes = await query('SELECT name, slug FROM templates WHERE id = $1 LIMIT 1', [id])
    const tplName = tplRes.rows[0]?.name || 'Template'

    // 3. Hapus template
    await query('DELETE FROM templates WHERE id = $1', [id])

    // Catat ke log
    await query(
      `INSERT INTO activity_logs (user_id, action, description)
       VALUES ($1, 'delete_template', $2)`,
      [session.id, `Menghapus template: ${tplName}`]
    )

    revalidatePath('/admin/templates')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/network')

    return { success: true }
  } catch (err) {
    console.error('Error deleting template:', err)
    return { error: 'Gagal menghapus template. Silakan coba lagi.' }
  }
}
