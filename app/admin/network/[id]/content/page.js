import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import ContentModulesClient from './ContentModulesClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const res = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  const name = res.rows[0]?.name || 'Website'
  return { title: `Kelola Konten - ${name}` }
}

export default async function ContentManagementPage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  // 1. Ambil data website
  const res = await query(
    `SELECT w.*, t.name AS template_name, t.slug AS template_slug
     FROM websites w
     LEFT JOIN templates t ON w.template_id = t.id
     WHERE w.id = $1 AND w.deleted_at IS NULL
     LIMIT 1`,
    [id]
  )

  if (res.rows.length === 0) notFound()

  const website = res.rows[0]

  // Otorisasi
  if (session.role !== 'super-admin' && website.user_id !== session.id) {
    redirect('/admin/network')
  }

  // 2. Ambil konten modul yang sudah tersimpan di database
  // Default 0 jika belum ada yang diinput
  const existingContentsMap = {}

  try {
    const resContents = await query(
      `SELECT c.id, c.title, c.body, m.slug AS module_slug
       FROM contents c
       JOIN menu_items m ON c.menu_item_id = m.id
       WHERE c.website_id = $1`,
      [id]
    )

    resContents.rows.forEach((row) => {
      const isFilled = Boolean(row.title || row.body)
      existingContentsMap[row.module_slug] = {
        title: row.title,
        body: row.body,
        has_content: isFilled,
      }
    })
  } catch (err) {
    console.error('Error fetching contents for website:', err)
  }

  const templateLabel = website.template_name || 'Template Kecamatan'
  const domainUrl = `https://bandung.go.id/${website.subdomain}`

  return (
    <div className="flex flex-col w-full space-y-6">

      {/* ── Top Navigation & Action Banner ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Kelola Konten Website
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              {website.name}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
            <span className="font-medium text-slate-700">{templateLabel}</span>
            <span className="text-slate-300">|</span>
            <a
              href={domainUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              <span>bandung.go.id/{website.subdomain}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/admin/network"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Jaringan
          </Link>
          <a
            href={`/${website.subdomain}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Pratinjau Website
          </a>
        </div>
      </div>

      {/* ── Content Modules Client (Health Metric, Search, Tabs, All 23 Modules & Modal) ── */}
      <ContentModulesClient
        website={website}
        existingContents={existingContentsMap}
      />

      {/* ── Operational Footer Help Banner ──────────────────────────── */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Butuh bantuan teknis migrasi data atau konfigurasi modul khusus {website.template_name || 'Kecamatan'}? Hubungi{' '}
            <span className="font-bold text-slate-800">Helpdesk Diskominfo Kota Bandung</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium px-2.5 py-1 rounded bg-slate-100 border border-slate-200/60">
            Versi CMS: 4.8.2-MultiTenant
          </span>
        </div>
      </div>

    </div>
  )
}
