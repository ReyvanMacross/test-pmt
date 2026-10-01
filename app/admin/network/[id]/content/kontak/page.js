import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import ContactForm from './ContactForm'

export async function generateMetadata({ params }) {
  const { id } = await params
  const result = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  return { title: `Kelola Informasi Kontak - ${result.rows[0]?.name || 'Website'}` }
}

export default async function ContactManagementPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!access) redirect('/login')
  const websiteResult = await query('SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  const website = websiteResult.rows[0]
  if (!website) notFound()
  if (!hasAdminPermission(access, 'manage-all-websites') && website.user_id !== session.id) redirect('/admin/network')

  const contactResult = await query(
    `SELECT contact_address, operating_hours, office_phone, whatsapp_phone, official_email,
            google_maps_url, instagram_username, facebook_page_name, youtube_channel_url
     FROM wilayah_profiles WHERE website_id = $1 LIMIT 1`, [website.id]
  )
  const contact = contactResult.rows[0] || {}

  return <div className="w-full space-y-6">
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Informasi Kontak</h1><p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500"><span>{website.name}</span><span>—</span><Link href={`/${website.subdomain}`} target="_blank" className="text-blue-600 hover:underline">bandung.go.id/{website.subdomain} <ExternalLink className="inline h-3 w-3"/></Link></p></div><Link href={`/admin/network/${website.id}/content`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4"/>Kembali</Link></section>
    <ContactForm website={website} initialContact={contact}/>
  </div>
}
