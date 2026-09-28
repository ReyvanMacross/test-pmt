import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import TemplatesHeader from './TemplatesHeader'
import TemplatesTable from './TemplatesTable'

export const metadata = {
  title: 'Manajemen Template Website - Portal Multi-Tenant',
}

export default async function TemplatesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Query templates dan jumlah website pengguna dari PostgreSQL
  let templates = []
  let totalTemplates = 0
  let usedTemplatesCount = 0
  let connectedWebsitesCount = 0

  try {
    const res = await query(`
      SELECT t.id, t.name, t.slug, t.description, t.preview_image, t.is_active, t.created_at, t.updated_at,
             COUNT(w.id) FILTER (WHERE w.deleted_at IS NULL) as usage_count
      FROM templates t
      LEFT JOIN websites w ON t.id = w.template_id
      GROUP BY t.id
      ORDER BY t.id ASC
    `)

    templates = res.rows
    totalTemplates = templates.length

    templates.forEach((t) => {
      const usage = parseInt(t.usage_count || 0, 10)
      if (usage > 0) {
        usedTemplatesCount++
        connectedWebsitesCount += usage
      }
    })
  } catch (err) {
    console.error('Error fetching templates in page:', err)
  }

  return (
    <div className="space-y-6">
      {/* ── Title Card (Header Page) ─────────────────────────────────── */}
      <TemplatesHeader />

      {/* ── 3 Metric Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Template */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Template</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalTemplates}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Template Digunakan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Template Digunakan</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{usedTemplatesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Card 3: Instansi Terhubung */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Instansi Terhubung</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{connectedWebsitesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Main Table Card: Daftar Template Tersedia ────────────────── */}
      <TemplatesTable templates={templates} />
    </div>
  )
}
