'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteWebsiteAction } from './actions'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'

export default function WebsiteTable({ websites }) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Filter berdasarkan kategori tab dan pencarian
  const filteredWebsites = websites.filter((ws) => {
    // 1. Filter Kategori
    if (filter === 'dinas' && ws.template_slug !== 'dinas') return false
    if (filter === 'kecamatan' && ws.template_slug !== 'kecamatan') return false
    if (filter === 'kelurahan' && ws.template_slug !== 'kelurahan') return false

    // 2. Filter Search
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName = ws.name?.toLowerCase().includes(q)
      const matchSlug = ws.subdomain?.toLowerCase().includes(q)
      const matchOwner = ws.owner_name?.toLowerCase().includes(q)
      return matchName || matchSlug || matchOwner
    }

    return true
  })

  function handleDelete(id, name) {
    setConfirmDelete({ id, name })
  }

  function executeDelete() {
    if (!confirmDelete) return
    startTransition(async () => {
      const formData = new FormData()
      formData.append('id', confirmDelete.id)
      const res = await deleteWebsiteAction(formData)
      setConfirmDelete(null)
      if (res?.error) {
        showToast('error', res.error)
      } else {
        showToast('success', 'Website berhasil dipindahkan ke sampah.')
        router.refresh()
      }
    })
  }

  return (
    <>
    <section aria-labelledby="table-title" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* ── Table Toolbar Controls ───────────────────────────────────────── */}
      <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilter('dinas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filter === 'dinas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Dinas &amp; Badan
          </button>
          <button
            type="button"
            onClick={() => setFilter('kecamatan')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filter === 'kecamatan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Kecamatan
          </button>
          <button
            type="button"
            onClick={() => setFilter('kelurahan')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filter === 'kelurahan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Kelurahan
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 bg-white outline-none"
              placeholder="Cari website, OPD, slug..."
            />
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 flex-shrink-0 cursor-pointer"
            title="Filter Lanjutan"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Table Element Container ──────────────────────────────────────── */}
      <div className="overflow-x-auto min-h-[340px] flex flex-col justify-between">
        <table className="w-full text-left border-collapse" id="websites-table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75">
              <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500" scope="col">
                Nama Perangkat Daerah
              </th>
              <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500" scope="col">
                Tipe / Kategori
              </th>
              <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500" scope="col">
                Slug / Subdomain
              </th>
              <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500" scope="col">
                Status Deploy
              </th>
              <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500" scope="col">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredWebsites.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-6 text-center text-slate-400">
                  <div className="text-sm font-medium">Tidak ada website yang sesuai kriteria.</div>
                  <p className="text-xs text-slate-400 mt-1">Coba ganti filter atau kata kunci pencarian Anda.</p>
                </td>
              </tr>
            ) : (
              filteredWebsites.map((ws) => {
                // Konfigurasi icon & warna kategori
                const isKec = ws.template_slug === 'kecamatan'
                const isKel = ws.template_slug === 'kelurahan'

                const categoryIconClass = isKec
                  ? 'bg-teal-50 text-teal-600 border-teal-100'
                  : isKel
                  ? 'bg-lime-50 text-lime-700 border-lime-100'
                  : 'bg-blue-50 text-blue-600 border-blue-100'

                const categoryBadgeClass = isKec
                  ? 'bg-teal-50 text-teal-600 border-teal-100'
                  : isKel
                  ? 'bg-lime-50 text-lime-700 border-lime-100'
                  : 'bg-blue-50 text-blue-600 border-blue-100'

                const categoryLabel = isKec ? 'Kecamatan' : isKel ? 'Kelurahan' : 'Dinas & Badan'

                return (
                  <tr key={ws.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Nama Perangkat Daerah */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0 ${categoryIconClass}`}>
                          {isKec ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                          ) : isKel ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-800 leading-snug">
                            {ws.name}
                          </span>
                          {ws.description && (
                            <span className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">
                              {ws.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tipe / Kategori */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded ${categoryBadgeClass}`}>
                        {isKec ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                          </svg>
                        ) : isKel ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                          </svg>
                        )}
                        {categoryLabel}
                      </span>
                    </td>

                    {/* Slug / Subdomain */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md font-mono text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 whitespace-nowrap select-all">
                        /{ws.subdomain}
                      </span>
                    </td>

                    {/* Status Deploy */}
                    <td className="py-4 px-6">
                      {ws.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      ) : ws.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Aksi: Lihat, Konten, Edit, Hapus */}
                    <td className="py-4 px-6">
                      <div className="grid grid-cols-2 gap-1.5 w-fit min-w-[140px]">
                        {/* Lihat */}
                        <a
                          href={`/${ws.subdomain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all duration-150 shadow-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-center justify-center inline-flex items-center"
                        >
                          Lihat
                        </a>

                        {/* Konten */}
                        <Link
                          href={`/admin/network/${ws.id}/content`}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all duration-150 shadow-xs hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 text-center justify-center inline-flex items-center"
                        >
                          Konten
                        </Link>

                        {/* Edit */}
                        <Link
                          href={`/admin/network/${ws.id}/edit`}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all duration-150 shadow-xs hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 text-center justify-center inline-flex items-center"
                        >
                          Edit
                        </Link>

                        {/* Hapus */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(ws.id, ws.name)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all duration-150 shadow-xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-center justify-center inline-flex items-center cursor-pointer disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Table Footer / Pagination */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan {filteredWebsites.length} dari {websites.length} website
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

      {/* Modal Konfirmasi Hapus Website */}
      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        title="Hapus Website?"
        message={`Apakah Anda yakin ingin memindahkan website "${confirmDelete?.name}" ke sampah?\nWebsite yang dihapus dapat dipulihkan kembali dari menu Sampah.`}
        confirmText="Hapus ke Sampah"
        cancelText="Batal"
        type="danger"
        loading={isPending}
      />
    </section>

    {/* Toast Popup Notification */}
    {toast && (
      <div className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm ${
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
    </>
  )
}
