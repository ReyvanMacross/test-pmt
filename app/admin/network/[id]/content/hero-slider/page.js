import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { canManageWebsite } from '@/lib/website-access'
import HeroSliderManager from './HeroSliderManager'

export const metadata = { title: 'Kelola Hero Slider' }

export default async function HeroSliderPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const result = await query(
    `SELECT w.id, w.user_id, w.name, w.subdomain
     FROM websites w WHERE w.id = $1 AND w.deleted_at IS NULL LIMIT 1`,
    [id]
  )
  const website = result.rows[0]
  if (!website) notFound()
  if (!(await canManageWebsite(session, website.id, website.user_id))) redirect('/admin/dashboard')

  const slidesResult = await query(
    `SELECT position, badge_text, badge_color, headline, description, image_path, image_name, is_active
     FROM hero_slides WHERE website_id = $1 ORDER BY position ASC`,
    [website.id]
  )
  const byPosition = new Map(slidesResult.rows.map((slide) => [Number(slide.position), slide]))
  const slides = [1, 2, 3].map((position) => byPosition.get(position) || {
    position,
    badge_text: '',
    badge_color: position === 2 ? 'emerald' : position === 3 ? 'amber' : 'teal',
    headline: '',
    description: '',
    image_path: null,
    image_name: null,
    is_active: false,
  })

  return <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div><p className="text-xs text-slate-500">Kelola Konten Website / Hero Slider</p><h1 className="mt-1 text-2xl font-extrabold text-slate-900">Hero Slider (Banner Utama)</h1><a href={`/${website.subdomain}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-sm font-medium text-blue-700 hover:underline">{website.name} · /{website.subdomain}</a></div>
      <Link href={`/admin/network/${website.id}/content`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Kembali</Link>
    </header>
    <HeroSliderManager websiteId={website.id} slides={slides}/>
  </div>
}
