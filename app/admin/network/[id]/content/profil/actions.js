'use server'

import { revalidatePath } from 'next/cache'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { canManageWebsite } from '@/lib/website-access'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { removePortalFile, uploadPortalFile } from '@/lib/storage'

// ─── Helper Otorisasi Website ─────────────────────────────────────────────────
async function authorizeWebsite(websiteId, session) {
  const res = await query('SELECT w.id, w.user_id, t.slug AS template_slug FROM websites w LEFT JOIN templates t ON t.id = w.template_id WHERE w.id = $1 AND w.deleted_at IS NULL LIMIT 1', [websiteId])
  const website = res.rows[0]
  if (!website || !(await canManageWebsite(session, websiteId, website.user_id))) {
    throw new Error('Anda tidak memiliki izin mengelola konten website ini.')
  }
  return website
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
  if (!session) return { error: 'Sesi berakhir. Silakan masuk kembali.' }
  let uploadedHero = null

  try {
    const website = await authorizeWebsite(websiteId, session)
    const incomingHero = formData.get('page_hero_file')
    if (incomingHero && typeof incomingHero === 'object' && incomingHero.size > 0) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(incomingHero.type)) return { error: 'Gambar header harus JPG, PNG, atau WebP.' }
      if (incomingHero.size > 5 * 1024 * 1024) return { error: 'Gambar header maksimal 5 MB.' }
    }

    // Ambil semua field dari formData
    const luas_wilayah = formData.get('statLuas')?.trim() || null
    const jumlah_rw = formData.get('statRW')?.trim() || null
    const jumlah_rt = formData.get('statRT')?.trim() || null
    const total_jiwa = formData.get('statJiwa')?.trim() || null
    const jumlah_kk = formData.get('statKK')?.trim() || null
    const kepuasan_warga = formData.get('statKepuasan')?.trim() || null

    const boundariesEnabled = website.template_slug !== 'dinas'
    const batas_utara = boundariesEnabled ? formData.get('batasUtara')?.trim() || null : null
    const batas_selatan = boundariesEnabled ? formData.get('batasSelatan')?.trim() || null : null
    const batas_timur = boundariesEnabled ? formData.get('batasTimur')?.trim() || null : null
    const batas_barat = boundariesEnabled ? formData.get('batasBarat')?.trim() || null : null
    const maps_embed_url = formData.get('mapEmbedUrl')?.trim() || null

    const visi = formData.get('visiKecamatan')?.trim() || null
    const misi = formData.get('misiKecamatan')?.trim() || null
    let kelurahanList
    try {
      kelurahanList = JSON.parse(String(formData.get('kelurahanList') || '[]'))
    } catch {
      return { error: 'Daftar kelurahan tidak terbaca. Periksa kembali isian.' }
    }
    if (!Array.isArray(kelurahanList) || kelurahanList.length > 100) {
      return { error: 'Daftar kelurahan tidak valid atau melebihi batas 100 data.' }
    }
    kelurahanList = kelurahanList.map((item) => ({
      nama: String(item?.nama || '').trim().slice(0, 120),
      deskripsi: String(item?.deskripsi || '').trim().slice(0, 500),
    })).filter((item) => item.nama)
    let boundaryDescriptions
    try {
      boundaryDescriptions = JSON.parse(String(formData.get('boundaryDescriptions') || '{}'))
    } catch {
      return { error: 'Keterangan batas wilayah tidak terbaca. Periksa kembali isian.' }
    }
    if (!boundaryDescriptions || typeof boundaryDescriptions !== 'object' || Array.isArray(boundaryDescriptions)) {
      return { error: 'Keterangan batas wilayah tidak valid.' }
    }
    boundaryDescriptions = Object.fromEntries(['Utara', 'Selatan', 'Timur', 'Barat'].map((direction) => [direction, boundariesEnabled ? String(boundaryDescriptions[direction] || '').trim().slice(0, 500) : '']))

    // 1. Upsert data ke wilayah_profiles
    await query(
      `INSERT INTO wilayah_profiles (
        website_id,
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
      )
      ON CONFLICT (website_id)
      DO UPDATE SET
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

    // 2. Simpan daftar kelurahan di metadata modul Profil, tanpa mengganggu
    // metadata profil lain yang mungkin sudah tersimpan.
    const menuItemId = await getOrCreateProfileMenuItemId()
    const currentContent = await query(
      'SELECT metadata FROM contents WHERE website_id = $1 AND menu_item_id = $2 LIMIT 1',
      [websiteId, menuItemId]
    )
    const metadata = currentContent.rows[0]?.metadata && typeof currentContent.rows[0].metadata === 'object' && !Array.isArray(currentContent.rows[0].metadata)
      ? { ...currentContent.rows[0].metadata }
      : {}
    const oldHero = metadata.page_hero_image
    const heroFile = formData.get('page_hero_file')
    const hasHeroUpload = heroFile && typeof heroFile === 'object' && heroFile.size > 0
    const removeHero = formData.get('remove_page_hero') === 'true'
    if (hasHeroUpload) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(heroFile.type)) return { error: 'Gambar header harus JPG, PNG, atau WebP.' }
      if (heroFile.size > 5 * 1024 * 1024) return { error: 'Gambar header maksimal 5 MB.' }
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[heroFile.type]
      uploadedHero = await uploadPortalFile({ file: heroFile, objectPath: `websites/${websiteId}/page-heroes/profil/${randomUUID()}${ext}` })
      metadata.page_hero_image = { url: uploadedHero.publicUrl, path: uploadedHero.path, name: heroFile.name, type: heroFile.type }
    } else if (removeHero) delete metadata.page_hero_image
    metadata.kelurahan_list = kelurahanList
    metadata.boundary_descriptions = boundaryDescriptions
    const profileHasData = Boolean(visi || misi || luas_wilayah || jumlah_rw || jumlah_rt || total_jiwa || jumlah_kk || kepuasan_warga || batas_utara || batas_selatan || batas_timur || batas_barat || maps_embed_url || kelurahanList.length || Object.values(boundaryDescriptions).some(Boolean))
    const contentTitle = profileHasData ? 'Profil Wilayah' : null
    // Visi/Misi disimpan hanya di wilayah_profiles, bukan sebagai deskripsi isi modul.
    const contentBody = null

    await query(
      `INSERT INTO contents (website_id, menu_item_id, title, body, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
       ON CONFLICT (website_id, menu_item_id)
       DO UPDATE SET
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
      [websiteId, menuItemId, contentTitle, contentBody, JSON.stringify(metadata)]
    )
    if ((hasHeroUpload || removeHero) && oldHero?.path) await removePortalFile(oldHero.url || oldHero.path).catch(() => {})

    // 3. Catat ke activity_logs
    const wsRes = await query('SELECT name, subdomain FROM websites WHERE id = $1 LIMIT 1', [websiteId])
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
    if (wsRes.rows[0]?.subdomain) {
      revalidatePath(`/${wsRes.rows[0].subdomain}`)
      revalidatePath(`/${wsRes.rows[0].subdomain}/profil`)
    }

    return { success: true, message: 'Perubahan profil berhasil disimpan.' }
  } catch (err) {
    if (uploadedHero?.path) await removePortalFile(`${uploadedHero.bucket}/${uploadedHero.path}`).catch(() => {})
    console.error('Error saving profile content:', err)
    return { error: err.message || 'Gagal menyimpan profil. Silakan coba lagi.' }
  }
}
