import { canManageWebsite } from '@/lib/website-access'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import GalleryVideoAlbumsClient from './GalleryVideoAlbumsClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const result = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  return { title: `Kelola Galeri Video - ${result.rows[0]?.name || 'Website'}` }
}

export default async function GalleryVideoPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')
  const websiteResult = await query('SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!(await canManageWebsite(session, website.id, website.user_id))) redirect('/admin/network')

  const albums = await query(
    `SELECT ga.id, ga.title, ga.album_date, ga.created_at, COUNT(gi.id)::int AS item_count
     FROM gallery_albums ga LEFT JOIN gallery_items gi ON gi.gallery_album_id = ga.id
     WHERE ga.website_id = $1 AND ga.type = 'video'
     GROUP BY ga.id ORDER BY ga.created_at DESC`, [website.id]
  )
  return <GalleryVideoAlbumsClient website={website} initialAlbums={albums.rows} />
}
