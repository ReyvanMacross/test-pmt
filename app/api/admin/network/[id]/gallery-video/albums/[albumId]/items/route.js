import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess } from '@/lib/admin-access'
import pool, { query } from '@/lib/db'
import { uploadPortalFile } from '@/lib/storage'
import { canManageWebsite } from '@/lib/website-access'

const MAX_VIDEO_SIZE = 50 * 1024 * 1024

function detectVideo(buffer) {
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return buffer.toString('ascii', 8, 12).startsWith('qt') ? '.mov' : '.mp4'
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return '.webm'
  return null
}

export async function POST(request, { params }) {
  let savedFile
  try {
    const { id: websiteId, albumId } = await params
    const session = await getSession()
    const access = await getCurrentAdminAccess()
    if (!session || !access) return NextResponse.json({ error: 'Sesi berakhir. Silakan masuk kembali.' }, { status: 401 })
    const websiteResult = await query('SELECT id, user_id, name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [websiteId])
    const website = websiteResult.rows[0]
    if (!website || !(await canManageWebsite(session, website.id, website.user_id))) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin mengelola galeri website ini.' }, { status: 403 })
    }

    const data = await request.formData()
    const file = data.get('file')
    const title = data.get('title')?.trim()
    const description = data.get('description')?.trim() || null
    if (!file || typeof file.arrayBuffer !== 'function' || file.size <= 0) return NextResponse.json({ error: 'Pilih berkas video terlebih dahulu.' }, { status: 400 })
    if (file.size > MAX_VIDEO_SIZE) return NextResponse.json({ error: 'Ukuran video maksimal 50 MB pada konfigurasi Supabase Storage saat ini.' }, { status: 413 })
    if (!title || title.length > 255) return NextResponse.json({ error: 'Judul video wajib diisi, maksimal 255 karakter.' }, { status: 400 })
    if (description && description.length > 5000) return NextResponse.json({ error: 'Deskripsi video maksimal 5.000 karakter.' }, { status: 400 })

    const albumResult = await query("SELECT id, title FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'video' LIMIT 1", [albumId, website.id])
    const album = albumResult.rows[0]
    if (!album) return NextResponse.json({ error: 'Album video tidak ditemukan.' }, { status: 404 })
    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = detectVideo(buffer)
    if (!extension) return NextResponse.json({ error: 'Berkas tidak dikenali sebagai video MP4, MOV, atau WebM.' }, { status: 400 })

    const fileName = `${randomUUID()}${extension}`
    const uploaded = await uploadPortalFile({ file, objectPath: `websites/${website.id}/gallery/videos/${album.id}/${fileName}` })
    savedFile = uploaded.publicUrl

    const client = await pool.connect()
    let item
    try {
      await client.query('BEGIN')
      const result = await client.query("INSERT INTO gallery_items (gallery_album_id, type, path, name, description, created_at, updated_at) VALUES ($1, 'video', $2, $3, $4, NOW(), NOW()) RETURNING id, gallery_album_id, type, path, name, description, created_at", [album.id, uploaded.publicUrl, title, description])
      item = result.rows[0]
      await client.query('INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)', [session.id, website.id, 'upload_video_file', `${website.name}: mengunggah video "${title}" ke album "${album.title}".`])
      await client.query('COMMIT')
    } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }

    return NextResponse.json({ success: true, message: 'Video berhasil diunggah.', item })
  } catch (error) {
    if (savedFile) {
      const { removePortalFile } = await import('@/lib/storage')
      await removePortalFile(savedFile).catch(() => {})
    }
    console.error('Upload gallery video error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengunggah video.' }, { status: 500 })
  }
}
