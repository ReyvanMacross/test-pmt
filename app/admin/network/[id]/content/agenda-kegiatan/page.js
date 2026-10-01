import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import AgendaManagerClient from './AgendaManagerClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const result = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  return { title: `Kelola Agenda Kegiatan - ${result.rows[0]?.name || 'Website'}` }
}

export default async function AgendaManagementPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')
  const websiteResult = await query('SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id) redirect('/admin/network')
  const result = await query(
    `SELECT id, title, description, start_date, end_date, time_range, location, organizer, created_at, updated_at
     FROM agendas WHERE website_id = $1 ORDER BY start_date ASC, created_at DESC`, [website.id]
  )
  const version = JSON.stringify(result.rows.map((agenda) => [agenda.id, agenda.updated_at]))
  return <AgendaManagerClient key={version} website={website} initialAgendas={result.rows}/>
}
