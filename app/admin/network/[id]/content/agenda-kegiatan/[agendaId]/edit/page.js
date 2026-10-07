import { canManageWebsite } from '@/lib/website-access'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import AgendaForm from '../../AgendaForm'

export async function generateMetadata({ params }) {
  const { agendaId } = await params
  const result = await query('SELECT title FROM agendas WHERE id = $1 LIMIT 1', [agendaId])
  return { title: `Edit Agenda Kegiatan - ${result.rows[0]?.title || 'Agenda'}` }
}

export default async function EditAgendaPage({ params }) {
  const { id, agendaId } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')
  const websiteResult = await query('SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!(await canManageWebsite(session, website.id, website.user_id))) redirect('/admin/network')
  const agendaResult = await query('SELECT id, title, description, start_date, end_date, time_range, location, organizer FROM agendas WHERE id = $1 AND website_id = $2 LIMIT 1', [agendaId, website.id])
  const agenda = agendaResult.rows[0]
  if (!agenda) notFound()

  return <div className="w-full space-y-6">
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Agenda Kegiatan</h1><p className="mt-1 text-sm text-slate-500">{website.name} <span className="px-1">—</span><Link href={`/${website.subdomain}`} target="_blank" className="text-blue-600 hover:underline">/{website.subdomain}</Link></p></div><Link href={`/admin/network/${website.id}/content/agenda-kegiatan`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4"/>Kembali</Link></section>
    <AgendaForm website={website} initialAgenda={agenda}/>
  </div>
}
