import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { canManageWebsite } from '@/lib/website-access'
import { CONTENT_MODULES } from '@/lib/content-modules'
import HeroPageManager from './HeroPageManager'

export const metadata = { title: 'Kelola Hero Halaman' }

export default async function HeroPagesAdminPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const result = await query(`SELECT w.id, w.user_id, w.name, w.subdomain
    FROM websites w WHERE w.id = $1 AND w.deleted_at IS NULL LIMIT 1`, [id])
  const website = result.rows[0]
  if (!website) notFound()
  if (!(await canManageWebsite(session, website.id, website.user_id))) redirect('/admin/dashboard')

  const pages = CONTENT_MODULES.filter((module) => !['beranda', 'hero-slider', 'hero-halaman', 'profil-pimpinan', 'struktur-organisasi'].includes(module.slug))
  const contentResult = await query(`SELECT m.slug, c.metadata
    FROM contents c JOIN menu_items m ON m.id = c.menu_item_id
    WHERE c.website_id = $1`, [website.id])
  const imagesBySlug = Object.fromEntries(contentResult.rows.map((row) => [row.slug, row.metadata?.page_hero_image || null]))
  const managedPages = pages.map((page) => ({ ...page, image: imagesBySlug[page.slug] || null }))

  return <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div><p className="text-xs text-slate-500">Kelola Konten Website / Hero Halaman</p><h1 className="mt-1 text-2xl font-extrabold text-slate-900">Hero Halaman (Selain Beranda)</h1><a href={`/${website.subdomain}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-sm font-medium text-blue-700 hover:underline">{website.name} · /{website.subdomain}</a></div>
      <Link href={`/admin/network/${website.id}/content`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Kembali</Link>
    </header>
    <HeroPageManager websiteId={website.id} pages={managedPages}/>
  </div>
}
