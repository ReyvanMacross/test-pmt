'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import pool, { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { canManageWebsite } from '@/lib/website-access'
import { removePortalFile, uploadPortalFile } from '@/lib/storage'

const COLORS = new Set(['teal', 'emerald', 'amber', 'blue', 'indigo', 'rose'])
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const IMAGE_EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }

export async function saveHeroSlidesAction(websiteId, formData) {
  const uploadedFiles = []
  try {
    const session = await getSession()
    if (!session) return { error: 'Sesi berakhir. Silakan masuk kembali.' }
    const websiteResult = await query('SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [websiteId])
    const website = websiteResult.rows[0]
    if (!website || !(await canManageWebsite(session, website.id, website.user_id))) {
      return { error: 'Anda tidak memiliki akses ke website ini.' }
    }
    const reject = async (message) => {
      await Promise.all(uploadedFiles.map((file) => removePortalFile(file.publicUrl).catch(() => {})))
      uploadedFiles.length = 0
      return { error: message }
    }

    const slides = []
    for (let position = 1; position <= 3; position += 1) {
      const read = (field) => String(formData.get(`slide_${position}_${field}`) || '').trim()
      const badgeText = read('badge_text')
      const badgeColor = read('badge_color') || (position === 2 ? 'emerald' : position === 3 ? 'amber' : 'teal')
      const headline = read('headline')
      const description = read('description')
      const isActive = formData.get(`slide_${position}_visibility`) === 'active'
      const removeImage = formData.get(`slide_${position}_remove_image`) === 'on'
      const image = formData.get(`slide_${position}_image`)
      const hasUpload = image && typeof image.size === 'number' && image.size > 0

      if (badgeText.length > 120 || headline.length > 180 || description.length > 1200) {
        return await reject(`Slide ${position}: badge maksimal 120, judul 180, dan deskripsi 1.200 karakter.`)
      }
      if (!COLORS.has(badgeColor)) return await reject(`Tema warna slide ${position} tidak valid.`)
      if (isActive && !headline) return await reject(`Judul wajib diisi agar Slide ${position} dapat ditampilkan.`)
      if (hasUpload && (!IMAGE_TYPES.has(image.type) || image.size > 5 * 1024 * 1024)) {
        return await reject(`Gambar Slide ${position} harus JPG, PNG, WebP, atau GIF maksimal 5 MB.`)
      }

      const existingResult = await query('SELECT image_path, image_name FROM hero_slides WHERE website_id = $1 AND position = $2 LIMIT 1', [website.id, position])
      const existing = existingResult.rows[0]
      let imagePath = existing?.image_path || null
      let imageName = existing?.image_name || null
      let imageType = null
      let imageSize = null

      if (hasUpload) {
        const ext = IMAGE_EXTENSIONS[image.type]
        const safeName = String(image.name || 'hero').replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) || 'hero'
        const upload = await uploadPortalFile({ file: image, objectPath: `websites/${website.id}/hero-slider/${position}/${randomUUID()}_${safeName}${ext}` })
        uploadedFiles.push(upload)
        imagePath = upload.publicUrl
        imageName = image.name
        imageType = image.type
        imageSize = image.size
      } else if (removeImage) {
        imagePath = null
        imageName = null
      }

      slides.push({ position, badgeText: badgeText || null, badgeColor, headline: headline || null, description: description || null, isActive, imagePath, imageName, imageType, imageSize, previousImage: existing?.image_path, imageChanged: Boolean(hasUpload || removeImage) })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const slide of slides) {
        await client.query(
          `INSERT INTO hero_slides (website_id, position, badge_text, badge_color, headline, description, image_path, image_name, image_type, image_size, is_active, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
           ON CONFLICT (website_id, position) DO UPDATE SET
             badge_text = EXCLUDED.badge_text, badge_color = EXCLUDED.badge_color,
             headline = EXCLUDED.headline, description = EXCLUDED.description,
             image_path = EXCLUDED.image_path, image_name = EXCLUDED.image_name,
             image_type = CASE WHEN $12::boolean THEN EXCLUDED.image_type ELSE COALESCE(EXCLUDED.image_type, hero_slides.image_type) END,
             image_size = CASE WHEN $12::boolean THEN EXCLUDED.image_size ELSE COALESCE(EXCLUDED.image_size, hero_slides.image_size) END,
             is_active = EXCLUDED.is_active, updated_at = NOW()`,
          [website.id, slide.position, slide.badgeText, slide.badgeColor, slide.headline, slide.description, slide.imagePath, slide.imageName, slide.imageType, slide.imageSize, slide.isActive, slide.imageChanged]
        )
      }
      await client.query(
        'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1,$2,$3,$4)',
        [session.id, website.id, 'update_content', `${website.name}: memperbarui tiga konfigurasi Hero Slider.`]
      )
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    await Promise.all(slides.filter((slide) => slide.imageChanged && slide.previousImage).map((slide) => removePortalFile(slide.previousImage).catch((error) => console.warn('Gagal menghapus gambar hero lama:', error.message))))
    revalidatePath(`/admin/network/${website.id}/content`)
    revalidatePath(`/admin/network/${website.id}/content/hero-slider`)
    revalidatePath(`/${website.subdomain}`)
    return { success: true, message: 'Hero Slider berhasil disimpan.' }
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => removePortalFile(file.publicUrl).catch(() => {})))
    console.error('Save hero slider error:', error)
    return { error: error.message || 'Gagal menyimpan Hero Slider.' }
  }
}
