import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import NewsManagementClient from './NewsManagementClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const result = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  return { title: `Kelola Berita - ${result.rows[0]?.name || 'Website'}` }
}

export default async function NewsManagementPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')

  const websiteResult = await query(
    `SELECT w.id, w.user_id, w.name, w.subdomain, t.name AS template_name
     FROM websites w LEFT JOIN templates t ON t.id = w.template_id
     WHERE w.id = $1 AND w.deleted_at IS NULL LIMIT 1`,
    [id]
  )
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id) {
    redirect('/admin/network')
  }

  const result = await query(
    `SELECT id, website_id, url, title, author, image, excerpt, source_domain, created_at, updated_at
     FROM news_items WHERE website_id = $1 ORDER BY created_at DESC`,
    [id]
  )

  return <NewsManagementClient website={website} initialNews={result.rows} />
}
