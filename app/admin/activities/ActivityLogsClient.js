'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Kategori badge berdasarkan action ────────────────────────────────────────
function getCategoryBadge(action) {
  if (!action) return { label: 'Sistem', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  const a = action.toLowerCase()
  if (a.includes('login') || a.includes('logout') || a.includes('auth') || a.includes('password'))
    return { label: 'Keamanan', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (a.includes('content') || a.includes('konten') || a.includes('update_content') || a.includes('gallery') || a.includes('news'))
    return { label: 'Konten', cls: 'bg-blue-50 text-blue-700 border-blue-200' }
  if (a.includes('create') || a.includes('deploy') || a.includes('restore'))
    return { label: 'Deploy', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (a.includes('delete') || a.includes('permanent') || a.includes('trash'))
    return { label: 'Hapus', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
  if (a.includes('template'))
    return { label: 'Template', cls: 'bg-purple-50 text-purple-700 border-purple-200' }
  if (a.includes('user') || a.includes('admin'))
    return { label: 'Pengguna', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  return { label: 'Sistem', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
}

// ─── Format tanggal & waktu Indonesia ────────────────────────────────────────
function formatDateTime(isoString) {
  if (!isoString) return { date: '-', time: '-' }
  const d = new Date(isoString)
  const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return { date, time }
}

// ─── Format entity dari action ────────────────────────────────────────────────
function getEntityLabel(log) {
  if (!log.action) return '-'
  const a = log.action.toLowerCase()
  if (a.includes('website')) return `Website #${log.website_id || '?'}`
  if (a.includes('template')) return `Template #${log.properties?.template_id || '?'}`
  if (a.includes('user')) return `User #${log.properties?.target_user_id || '?'}`
  if (a.includes('content')) return `Content #${log.properties?.menu_item_id || '?'}`
  if (a.includes('login') || a.includes('auth')) return `AuthSession #${log.id}`
  if (a.includes('gallery')) return `Gallery #${log.properties?.album_id || log.id}`
  return `Log #${log.id}`
}

const PER_PAGE = 15

export default function ActivityLogsClient({ initialLogs, totalToday, totalWeek, totalMonth, totalAll, users }) {
  const [logs, setLogs] = useState(initialLogs)
  const [total, setTotal] = useState(totalAll)
  const [page, setPage] = useState(1)
  const [filterRole, setFilterRole] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async (p, role, date, q) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: p,
        limit: PER_PAGE,
        ...(role && { role }),
        ...(date && { date }),
        ...(q && { q }),
      })
      const res = await fetch(`/api/admin/activities?${params}`)
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch (e) {
      console.error('Failed to fetch activity logs:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Re-fetch whenever filter/page changes
  useEffect(() => {
    fetchLogs(page, filterRole, filterDate, search)
  }, [page, filterRole, filterDate, fetchLogs]) // search triggered separately via form submit / debounce

  function handleFilterChange(role, date) {
    setPage(1)
    setFilterRole(role)
    setFilterDate(date)
    fetchLogs(1, role, date, search)
  }

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    fetchLogs(1, filterRole, filterDate, search)
  }

  const totalPages = Math.ceil(total / PER_PAGE)
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1
  const to = Math.min(page * PER_PAGE, total)

  return (
    <>
      {/* ── 4 Metric Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Hari Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hari Ini</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalToday.toLocaleString('id-ID')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Minggu Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Minggu Ini</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalWeek.toLocaleString('id-ID')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bulan Ini</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalMonth.toLocaleString('id-ID')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Total Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Logs</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalAll.toLocaleString('id-ID')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Main Table Card ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Riwayat Audit Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">Semua aktivitas sistem tercatat secara otomatis.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Role */}
            <select
              className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer shadow-sm"
              value={filterRole}
              onChange={(e) => handleFilterChange(e.target.value, filterDate)}
            >
              <option value="">-- Semua User --</option>
              <option value="super-admin">Super Admin</option>
              <option value="admin-dinas">Admin Dinas</option>
              <option value="admin-kecamatan">Admin Kecamatan</option>
              <option value="admin-kelurahan">Admin Kelurahan</option>
            </select>

            {/* Filter Tanggal */}
            <input
              type="date"
              className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 shadow-sm"
              value={filterDate}
              onChange={(e) => handleFilterChange(filterRole, e.target.value)}
            />

            {/* Cari */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Cari deskripsi atau aksi..."
                className="w-56 px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-800 placeholder-slate-400 shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition shadow-sm"
              >
                Cari
              </button>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Waktu &amp; Tanggal</th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pengguna</th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi Aktivitas</th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Entitas / Objek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm text-slate-400 font-medium">Memuat log aktivitas...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-600">Tidak ada log ditemukan</p>
                      <p className="text-xs text-slate-400">Coba ubah filter atau kata kunci pencarian</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const { date, time } = formatDateTime(log.created_at)
                  const badge = getCategoryBadge(log.action)
                  const entity = getEntityLabel(log)
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-mono text-xs font-semibold text-slate-800">{date}</div>
                        <div className="font-mono text-[11px] text-slate-400">{time} WIB</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-xs">{log.user_name || 'Sistem'}</div>
                        <div className="text-[11px] text-slate-400">{log.user_email || log.user_role || '-'}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded font-semibold text-[11px] border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-700 max-w-sm leading-relaxed">
                        {log.description || log.action?.replace(/_/g, ' ') || '-'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-medium font-mono text-xs">
                          {entity}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            {total === 0
              ? 'Tidak ada log aktivitas'
              : `Menampilkan ${from}–${to} dari ${total.toLocaleString('id-ID')} log aktivitas`}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Sebelumnya
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={loading}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition shadow-sm
                    ${page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
