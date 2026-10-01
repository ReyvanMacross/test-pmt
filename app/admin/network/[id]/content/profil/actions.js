'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

// ─── Helper Otorisasi Website ─────────────────────────────────────────────────
async function authorizeWebsite(websiteId, session) {
  if (session.role === 'super-admin') return true

  const res = await query(
    'SELECT user_id FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [websiteId]
  )
  if (res.rows.length === 0 || res.rows[0].user_id !== session.id) {
    throw new Error('Anda tidak memiliki izin mengelola konten website ini.')
  }
  return true
}

// ─── Helper Dapatkan atau Buat menu_item_id untuk profil ──────────────────────
async function getOrCreateProfileMenuItemId() {
  const findRes = await query('SELECT id FROM menu_items WHERE slug = $1 LIMIT 1', ['profil'])
  if (findRes.rows.length > 0) {
    return findRes.rows[0].id
  }

  const insertRes = await query(
    `INSERT INTO menu_items (name, slug, "order", available_for, is_active)
     VALUES ($1, $2, 2, ARRAY['dinas', 'kecamatan', 'kelurahan'], true)
     RETURNING id`,
    ['Profil', 'profil']
  )
  return insertRes.rows[0].id
}

// ─── Action: Simpan Profil Wilayah ───────────────────────────────────────────
export async function saveProfileContentAction(websiteId, formData) {
  const session = await getSession()
  if (!session) redirect('/login')

  try {
    await authorizeWebsite(websiteId, session)

    // Ambil semua field dari formData
    const banner_title = formData.get('bannerTitle')?.trim() || null
    const banner_subtitle = formData.get('bannerDescription')?.trim() || null

    const luas_wilayah = formData.get('statLuas')?.trim() || null
    const jumlah_rw = formData.get('statRW')?.trim() || null
    const jumlah_rt = formData.get('statRT')?.trim() || null
    const total_jiwa = formData.get('statJiwa')?.trim() || null
    const jumlah_kk = formData.get('statKK')?.trim() || null
    const kepuasan_warga = formData.get('statKepuasan')?.trim() || null

    const batas_utara = formData.get('batasUtara')?.trim() || null
    const batas_selatan = formData.get('batasSelatan')?.trim() || null
    const batas_timur = formData.get('batasTimur')?.trim() || null
    const batas_barat = formData.get('batasBarat')?.trim() || null
    const maps_embed_url = formData.get('mapEmbedUrl')?.trim() || null

    const visi = formData.get('visiKecamatan')?.trim() || null
    const misi = formData.get('misiKecamatan')?.trim() || null

    // 1. Upsert data ke wilayah_profiles
    await query(
      `INSERT INTO wilayah_profiles (
        website_id,
        banner_title,
        banner_subtitle,
        luas_wilayah,
        jumlah_rw,
        jumlah_rt,
        total_jiwa,
        jumlah_kk,
        kepuasan_warga,
        batas_utara,
        batas_selatan,
        batas_timur,
        batas_barat,
        maps_embed_url,
        visi,
        misi,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
      )
      ON CONFLICT (website_id)
      DO UPDATE SET
        banner_title = EXCLUDED.banner_title,
        banner_subtitle = EXCLUDED.banner_subtitle,
        luas_wilayah = EXCLUDED.luas_wilayah,
        jumlah_rw = EXCLUDED.jumlah_rw,
        jumlah_rt = EXCLUDED.jumlah_rt,
        total_jiwa = EXCLUDED.total_jiwa,
        jumlah_kk = EXCLUDED.jumlah_kk,
        kepuasan_warga = EXCLUDED.kepuasan_warga,
        batas_utara = EXCLUDED.batas_utara,
        batas_selatan = EXCLUDED.batas_selatan,
        batas_timur = EXCLUDED.batas_timur,
        batas_barat = EXCLUDED.batas_barat,
        maps_embed_url = EXCLUDED.maps_embed_url,
        visi = EXCLUDED.visi,
        misi = EXCLUDED.misi,
        updated_at = NOW()`,
      [
        websiteId,
        banner_title,
        banner_subtitle,
        luas_wilayah,
        jumlah_rw,
        jumlah_rt,
        total_jiwa,
        jumlah_kk,
        kepuasan_warga,
        batas_utara,
        batas_selatan,
        batas_timur,
        batas_barat,
        maps_embed_url,
        visi,
        misi,
      ]
    )

    // 2. Sinkronkan ke tabel contents untuk modul 'profil' agar status keterisian sinkron
    try {
      const menuItemId = await getOrCreateProfileMenuItemId()
      const contentTitle = banner_title || 'Profil Wilayah'
      const contentBody = visi || banner_subtitle || 'Konten profil wilayah'

      await query(
        `INSERT INTO contents (website_id, menu_item_id, title, body, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (website_id, menu_item_id)
         DO UPDATE SET
           title = EXCLUDED.title,
           body = EXCLUDED.body,
           updated_at = NOW()`,
        [websiteId, menuItemId, contentTitle, contentBody]
      )
    } catch (syncErr) {
      console.error('Warning: Error syncing to contents table:', syncErr)
    }

    // 3. Catat ke activity_logs
    const wsRes = await query('SELECT name FROM websites WHERE id = $1 LIMIT 1', [websiteId])
    const websiteName = wsRes.rows[0]?.name || 'Website'

    await query(
      `INSERT INTO activity_logs (user_id, website_id, action, description)
       VALUES ($1, $2, $3, $4)`,
      [
        session.id,
        websiteId,
        'update_profile',
        `${websiteName}: Memperbarui informasi konten profil wilayah.`,
      ]
    )

    revalidatePath(`/admin/network/${websiteId}/content`)
    revalidatePath(`/admin/network/${websiteId}/content/profil`)
    revalidatePath('/admin/dashboard')

    return { success: true, message: 'Perubahan profil berhasil disimpan.' }
  } catch (err) {
    console.error('Error saving profile content:', err)
    return { error: err.message || 'Gagal menyimpan profil. Silakan coba lagi.' }
  }
}
