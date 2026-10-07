import { canManageWebsite } from '@/lib/website-access'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import ServicesManagerClient from './ServicesManagerClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const result = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  return { title: `Kelola Layanan Publik - ${result.rows[0]?.name || 'Website'}` }
}

export default async function ServicesPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')
  const websiteResult = await query('SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!(await canManageWebsite(session, website.id, website.user_id))) redirect('/admin/network')
  const result = await query(
    `SELECT id, website_id, name, category, description, requirements, procedure, completion_time, fee, application_url, created_at, updated_at
     FROM services WHERE website_id = $1 ORDER BY category ASC, name ASC`, [website.id]
  )
  const version = JSON.stringify(result.rows.map((service) => [service.id, service.updated_at]))
  return <ServicesManagerClient key={version} website={website} initialServices={result.rows}/>
}
