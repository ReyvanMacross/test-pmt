import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import WebsiteTable from './WebsiteTable'
import NetworkHeader from './NetworkHeader'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'

export const metadata = { title: 'Manajemen Website Perangkat Daerah' }

export default async function NetworkAdminPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  const canViewAllWebsites = hasAdminPermission(access, 'manage-all-websites')
  if (!canViewAllWebsites && !hasAdminPermission(access, 'manage-assigned-website')) redirect('/admin/dashboard')

  const isSuperAdmin = canViewAllWebsites

  let websites = []
  let templates = []
  let countDinas = 0
  let countKecamatan = 0
  let countKelurahan = 0
  let totalWeb = 0

  try {
    // 0. Query Daftar Templates (untuk modal)
    const resTemplates = await query(
      `SELECT id, name, slug, description FROM templates WHERE is_active = true ORDER BY id ASC`
    )
    templates = resTemplates.rows

    // 1. Query Daftar Website
    let sql = `
      SELECT w.*, t.name as template_name, t.slug as template_slug, u.name as owner_name
      FROM websites w
      LEFT JOIN templates t ON w.template_id = t.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.deleted_at IS NULL
    `
    const params = []

    if (!isSuperAdmin) {
      sql += ' AND w.user_id = $1'
      params.push(session.id)
    }

    sql += ' ORDER BY w.created_at DESC'

    const res = await query(sql, params)
    websites = res.rows

    // 2. Query Metrik Statistik
    const userFilter = isSuperAdmin ? '' : ' AND w.user_id = $1'
    const metricParams = isSuperAdmin ? [] : [session.id]

    const [resDinas, resKec, resKel, resTotal] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM websites w JOIN templates t ON w.template_id = t.id WHERE t.slug = 'dinas' AND w.deleted_at IS NULL${userFilter}`,
        metricParams
      ),
      query(
        `SELECT COUNT(*) FROM websites w JOIN templates t ON w.template_id = t.id WHERE t.slug = 'kecamatan' AND w.deleted_at IS NULL${userFilter}`,
        metricParams
      ),
      query(
        `SELECT COUNT(*) FROM websites w JOIN templates t ON w.template_id = t.id WHERE t.slug = 'kelurahan' AND w.deleted_at IS NULL${userFilter}`,
        metricParams
      ),
      query(
        `SELECT COUNT(*) FROM websites w WHERE w.deleted_at IS NULL${userFilter}`,
        metricParams
      ),
    ])

    countDinas = parseInt(resDinas.rows[0].count, 10)
    countKecamatan = parseInt(resKec.rows[0].count, 10)
    countKelurahan = parseInt(resKel.rows[0].count, 10)
    totalWeb = parseInt(resTotal.rows[0].count, 10)
  } catch (err) {
    console.error('Error loading Network Admin data:', err)
  }

  // Waktu terkini WIB
  const updateTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-8">
      {/* ── BEGIN: PageTitleAndActions (via NetworkHeader) ──────────────── */}
      <NetworkHeader templates={templates} />
      {/* ── END: PageTitleAndActions ───────────────────────────────────── */}

      {/* ── BEGIN: MetricsSection ───────────────────────────────────────── */}
      <section aria-labelledby="metrics-heading">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase" id="metrics-heading">
            Website Terdeploy Berdasarkan Kategori
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Diperbarui: Hari ini, {updateTime} WIB
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Dinas & Badan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Dinas &amp; Badan
              </span>
              <div className="text-3xl font-bold text-slate-900 mt-1.5">{countDinas}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
              </svg>
            </div>
          </div>

          {/* Kecamatan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Kecamatan
              </span>
              <div className="text-3xl font-bold text-slate-900 mt-1.5">{countKecamatan}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
              </svg>
            </div>
          </div>

          {/* Kelurahan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Kelurahan
              </span>
              <div className="text-3xl font-bold text-slate-900 mt-1.5">{countKelurahan}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-lime-50 text-lime-700 flex items-center justify-center border border-lime-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
              </svg>
            </div>
          </div>

          {/* Total Web */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Web
              </span>
              <div className="text-3xl font-bold text-slate-900 mt-1.5">{totalWeb}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
              </svg>
            </div>
          </div>
        </div>
      </section>
      {/* ── END: MetricsSection ─────────────────────────────────────────── */}

      {/* ── BEGIN: DataTableSection ─────────────────────────────────────── */}
      <WebsiteTable websites={websites} />
      {/* ── END: DataTableSection ───────────────────────────────────────── */}
    </div>
  )
}
