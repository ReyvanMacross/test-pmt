import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import TrashedTable from './TrashedTable'
import { getCurrentAdminAccess } from '@/lib/admin-access'

export const metadata = { title: 'Sampah Website - Manajemen Website' }

export default async function TrashedPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if ((access?.role || session.role) !== 'super-admin') redirect('/admin/network')

  const isSuperAdmin = session.role === 'super-admin'

  let websites = []

  try {
    // Ambil website yang sudah di-soft-delete (deleted_at IS NOT NULL)
    let sql = `
      SELECT w.*, t.name AS template_name, t.slug AS template_slug, u.name AS owner_name
      FROM websites w
      LEFT JOIN templates t ON w.template_id = t.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.deleted_at IS NOT NULL
    `
    const params = []

    // Non super-admin hanya lihat milik sendiri
    if (!isSuperAdmin) {
      sql += ' AND w.user_id = $1'
      params.push(session.id)
    }

    sql += ' ORDER BY w.deleted_at DESC'

    const res = await query(sql, params)
    websites = res.rows
  } catch (err) {
    console.error('Error loading trashed websites:', err)
  }

  const totalTrashed = websites.length

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sampah Website Perangkat Daerah
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
              {totalTrashed} Terhapus
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Daftar website perangkat daerah yang telah dihapus sementara. Anda dapat memulihkan (restore) website atau menghapusnya secara permanen.
          </p>
        </div>

        <Link
          href="/admin/network"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 text-sm font-semibold transition-all shadow-xs self-start md:self-auto whitespace-nowrap"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Kembali ke Daftar Website
        </Link>
      </div>

      {/* ── Warning Banner 30 Hari ───────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3.5 text-sm shadow-xs">
        <div className="w-8 h-8 rounded-lg bg-amber-100/70 border border-amber-300/50 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-amber-900 leading-tight mb-0.5">
            Kebijakan Penyimpanan Sampah 30 Hari
          </h3>
          <p className="text-xs leading-relaxed text-amber-800/90">
            Website yang berada di Sampah akan otomatis dihapus secara permanen setelah 30 hari jika tidak dipulihkan.
            Website yang dihapus secara permanen tidak dapat dikembalikan lagi beserta seluruh konten dan basis datanya.
          </p>
        </div>
      </div>

      {/* ── Tabel Sampah (Client Component) ─────────────── */}
      <TrashedTable websites={websites} isSuperAdmin={isSuperAdmin} />
    </div>
  )
}
