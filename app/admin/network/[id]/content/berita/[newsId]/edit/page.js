import { canManageWebsite } from '@/lib/website-access'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import EditNewsForm from './EditNewsForm'

export async function generateMetadata({ params }) {
  const { newsId } = await params
  const result = await query('SELECT title FROM news_items WHERE id = $1 LIMIT 1', [newsId])
  return { title: `Edit Link Berita - ${result.rows[0]?.title || 'Berita'}` }
}

export default async function EditNewsPage({ params }) {
  const { id, newsId } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')

  const websiteResult = await query(
    `SELECT w.id, w.user_id, w.name, w.subdomain FROM websites w
     WHERE w.id = $1 AND w.deleted_at IS NULL LIMIT 1`,
    [id]
  )
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!(await canManageWebsite(session, website.id, website.user_id))) redirect('/admin/network')

  const newsResult = await query(
    `SELECT id, website_id, url, title, author, image, excerpt, source_domain
     FROM news_items WHERE id = $1 AND website_id = $2 LIMIT 1`,
    [newsId, id]
  )
  const news = newsResult.rows[0]
  if (!news) notFound()

  return <EditNewsForm website={website} news={news} />
}
