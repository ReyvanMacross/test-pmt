import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import AnnouncementManagerClient from './AnnouncementManagerClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const result = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  return { title: `Kelola Pengumuman - ${result.rows[0]?.name || 'Website'}` }
}

export default async function AnnouncementManagementPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')
  const websiteResult = await query('SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id) redirect('/admin/network')
  const announcements = await query(
    `SELECT id, title, body, publish_date, expires_at, attachment_path, attachment_name, attachment_type, attachment_size, created_at, updated_at
     FROM announcements WHERE website_id = $1 ORDER BY publish_date DESC, created_at DESC`, [website.id]
  )
  const listVersion = JSON.stringify(announcements.rows.map((item) => [item.id, item.updated_at]))
  return <AnnouncementManagerClient key={listVersion} website={website} initialAnnouncements={announcements.rows}/>
}
