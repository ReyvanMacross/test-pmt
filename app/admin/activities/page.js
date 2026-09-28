import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import ActivityLogsClient from './ActivityLogsClient'

export const metadata = {
  title: 'Activity Logs | Admin Panel',
}

const PER_PAGE = 15

export default async function ActivityLogsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'super-admin') redirect('/admin/dashboard')

  // ── Metrik summary ─────────────────────────────────────────────────────────
  let totalToday = 0
  let totalWeek = 0
  let totalMonth = 0
  let totalAll = 0
  let initialLogs = []

  try {
    const [resToday, resWeek, resMonth, resAll] = await Promise.all([
      query(`SELECT COUNT(*) FROM activity_logs WHERE created_at >= NOW() - INTERVAL '1 day'`),
      query(`SELECT COUNT(*) FROM activity_logs WHERE created_at >= NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(*) FROM activity_logs WHERE created_at >= NOW() - INTERVAL '30 days'`),
      query(`SELECT COUNT(*) FROM activity_logs`),
    ])

    totalToday = parseInt(resToday.rows[0].count, 10)
    totalWeek = parseInt(resWeek.rows[0].count, 10)
    totalMonth = parseInt(resMonth.rows[0].count, 10)
    totalAll = parseInt(resAll.rows[0].count, 10)

    // Initial page 1 data
    const resLogs = await query(`
      SELECT
        a.id,
        a.action,
        a.description,
        a.website_id,
        a.properties,
        a.ip_address,
        a.created_at,
        u.name  AS user_name,
        u.email AS user_email,
        u.role  AS user_role,
        w.name  AS website_name
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN websites w ON a.website_id = w.id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET 0
    `, [PER_PAGE])

    initialLogs = resLogs.rows.map((r) => ({
      ...r,
      properties: r.properties || {},
    }))
  } catch (err) {
    console.error('ActivityLogs DB Error:', err)
  }

  return (
    <div className="space-y-6">
      {/* ── Title Banner ───────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            Audit Logs &amp; Activity Records
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Rekam jejak aktivitas sistem, perubahan konten, dan riwayat otentikasi portal multi-tenant.
          </p>
        </div>
        {/* Indicator badge real-time */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live — diperbarui otomatis
        </div>
      </div>

      {/* ── Client Component: Metrik + Filter + Tabel + Pagination ──────── */}
      <ActivityLogsClient
        initialLogs={initialLogs}
        totalToday={totalToday}
        totalWeek={totalWeek}
        totalMonth={totalMonth}
        totalAll={totalAll}
      />
    </div>
  )
}
