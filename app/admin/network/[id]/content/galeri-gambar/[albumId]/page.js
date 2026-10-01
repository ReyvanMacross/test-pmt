import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import GalleryAlbumClient from './GalleryAlbumClient'

export async function generateMetadata({ params }) {
  const { albumId } = await params
  const result = await query("SELECT title FROM gallery_albums WHERE id = $1 AND type = 'image' LIMIT 1", [albumId])
  return { title: `Kelola Isi Album - ${result.rows[0]?.title || 'Galeri Gambar'}` }
}

export default async function GalleryAlbumPage({ params }) {
  const { id, albumId } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')

  const websiteResult = await query(
    'SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id]
  )
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id) redirect('/admin/network')

  const albumResult = await query(
    "SELECT id, title, album_date FROM gallery_albums WHERE id = $1 AND website_id = $2 AND type = 'image' LIMIT 1",
    [albumId, website.id]
  )
  const album = albumResult.rows[0]
  if (!album) notFound()
  const itemResult = await query(
    "SELECT id, gallery_album_id, type, path, name, description, created_at FROM gallery_items WHERE gallery_album_id = $1 AND type = 'image' ORDER BY created_at DESC",
    [album.id]
  )

  return <GalleryAlbumClient website={website} initialAlbum={album} initialItems={itemResult.rows} />
}
