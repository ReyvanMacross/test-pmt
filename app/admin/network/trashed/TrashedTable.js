'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { restoreWebsiteAction, permanentDeleteWebsiteAction } from '../actions'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'

// Icon helper berdasarkan template slug
function CategoryIcon({ slug }) {
  if (slug === 'dinas') {
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      </div>
    )
  }
  if (slug === 'kecamatan') {
    return (
      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-lime-50 text-lime-700 flex items-center justify-center border border-lime-100 flex-shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    </div>
  )
}

function CategoryBadge({ slug, label }) {
  if (slug === 'dinas') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
        {label}
      </span>
    )
  }
  if (slug === 'kecamatan') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-600 border border-teal-100 rounded">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-lime-50 text-lime-700 border border-lime-100 rounded">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
      {label}
    </span>
  )
}

function daysRemaining(deletedAt) {
  const deleted = new Date(deletedAt)
  const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export default function TrashedTable({ websites, isSuperAdmin }) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState(null)
  const [modalAction, setModalAction] = useState(null) // { type: 'restore' | 'delete', ws: Object }
  const [toast, setToast] = useState(null) // { type: 'success' | 'error', message: string }

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Hitung jumlah per kategori
  const countDinas = websites.filter((w) => w.template_slug === 'dinas').length
  const countKec = websites.filter((w) => w.template_slug === 'kecamatan').length
  const countKel = websites.filter((w) => w.template_slug === 'kelurahan').length

  const tabs = [
    { key: 'all', label: `Semua Terhapus (${websites.length})` },
    { key: 'dinas', label: `Dinas & Badan (${countDinas})` },
    { key: 'kecamatan', label: `Kecamatan (${countKec})` },
    { key: 'kelurahan', label: `Kelurahan (${countKel})` },
  ]

  const filtered = useMemo(() => {
    let result = websites
    if (activeFilter !== 'all') {
      result = result.filter((w) => w.template_slug === activeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (w) =>
          w.name?.toLowerCase().includes(q) ||
          w.subdomain?.toLowerCase().includes(q) ||
          w.template_name?.toLowerCase().includes(q)
      )
    }
    return result
  }, [websites, activeFilter, search])

  async function executeModalAction() {
    if (!modalAction) return
    const { type, ws } = modalAction
    setLoadingId(`${type}-${ws.id}`)

    const fd = new FormData()
    fd.set('id', ws.id)

    try {
      let res
      if (type === 'restore') {
        res = await restoreWebsiteAction(fd)
      } else if (type === 'delete') {
        res = await permanentDeleteWebsiteAction(fd)
      }

      if (res?.error) {
        showToast('error', res.error)
      } else {
        showToast('success', res?.message || 'Aksi berhasil dijalankan.')
        setModalAction(null)
        router.refresh()
      }
    } catch (err) {
      console.error('executeModalAction error:', err)
      showToast('error', 'Terjadi kesalahan, silakan coba lagi.')
    } finally {
      setLoadingId(null)
    }
  }

  function handleRestore(ws) {
    setModalAction({ type: 'restore', ws })
  }

  function handlePermanentDelete(ws) {
    setModalAction({ type: 'delete', ws })
  }

  return (
    <>
      {/* Toast Popup Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {toast.type === 'success' ? (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
          <button onClick={() => setToast(null)} className="flex-shrink-0 ml-auto text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari website terhapus, OPD, slug..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 bg-white outline-none"
            />
          </div>
          <button
            onClick={() => { setSearch(''); setActiveFilter('all') }}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 flex-shrink-0 cursor-pointer"
            title="Reset Filter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[340px] flex flex-col justify-between">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75">
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Nama Perangkat Daerah</th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tipe / Kategori</th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Slug / Subdomain</th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tanggal Dihapus / Sisa Waktu</th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap text-right pr-6">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Tidak ada website di sampah</p>
                    <p className="text-xs text-slate-400">
                      {search ? 'Coba ubah kata pencarian' : 'Semua website dalam kondisi aktif'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((ws) => {
                const deletedDate = ws.deleted_at
                  ? new Date(ws.deleted_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '-'
                const remaining = ws.deleted_at ? daysRemaining(ws.deleted_at) : 0
                const isRestoring = loadingId === `restore-${ws.id}`
                const isDeleting = loadingId === `delete-${ws.id}`

                return (
                  <tr key={ws.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Nama */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <CategoryIcon slug={ws.template_slug} />
                        <span className="font-bold text-sm text-slate-900 leading-snug max-w-[200px] break-words">
                          {ws.name}
                        </span>
                      </div>
                    </td>

                    {/* Tipe */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge slug={ws.template_slug} label={ws.template_name} />
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 select-all">
                        /{ws.subdomain}
                      </span>
                    </td>

                    {/* Tanggal Dihapus */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-slate-800">{deletedDate}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 font-medium ${
                          remaining <= 7
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <svg className={`w-3 h-3 ${remaining <= 7 ? 'text-rose-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {remaining > 0 ? `${remaining} hari tersisa` : 'Kedaluwarsa'}
                        </span>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 whitespace-nowrap pr-6">
                      <div className="flex flex-col items-end gap-1.5">
                        {/* Pulihkan */}
                        <button
                          type="button"
                          onClick={() => handleRestore(ws)}
                          disabled={isRestoring || isDeleting}
                          className="w-36 justify-center py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isRestoring ? (
                            <svg className="animate-spin w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                          )}
                          <span>{isRestoring ? 'Memulihkan...' : 'Pulihkan'}</span>
                        </button>

                        {/* Hapus Permanen — hanya super-admin */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(ws)}
                            disabled={isRestoring || isDeleting}
                            className="w-36 justify-center py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? (
                              <svg className="animate-spin w-3.5 h-3.5 text-rose-600" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                            )}
                            <span>{isDeleting ? 'Menghapus...' : 'Hapus Permanen'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan {filtered.length} dari {websites.length} website terhapus
          </span>
          <div className="flex items-center gap-1 opacity-50 cursor-not-allowed">
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white" disabled>
              Sebelumnya
            </button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white" disabled>
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Pulihkan / Hapus Permanen */}
      <ConfirmModal
        isOpen={Boolean(modalAction)}
        onClose={() => setModalAction(null)}
        onConfirm={executeModalAction}
        title={
          modalAction?.type === 'restore'
            ? 'Pulihkan Website?'
            : 'Hapus Permanen Website?'
        }
        message={
          modalAction?.type === 'restore'
            ? `Website "${modalAction?.ws?.name}" akan dipulihkan kembali ke daftar aktif dengan status Aktif.`
            : `⚠️ Seluruh data, halaman konten, menu, berita, dan galeri website "${modalAction?.ws?.name}" akan DIHAPUS SELAMANYA dari database dan tidak dapat dipulihkan lagi.`
        }
        confirmText={
          modalAction?.type === 'restore' ? 'Ya, Pulihkan' : 'Hapus Permanen'
        }
        cancelText="Batal"
        type={modalAction?.type === 'restore' ? 'success' : 'danger'}
        loading={Boolean(loadingId)}
      />
    </section>
    </>
  )
}
