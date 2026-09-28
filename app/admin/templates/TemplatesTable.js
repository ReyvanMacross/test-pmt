'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// Helper icon & subtitle per slug template
function getTemplateMeta(slug) {
  switch (slug) {
    case 'dinas':
      return {
        subtitle: 'Kategori SKPD / Badan Teknis',
        iconBg: 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      }
    case 'kecamatan':
      return {
        subtitle: 'Kategori Wilayah Kewilayahan',
        iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      }
    case 'kelurahan':
      return {
        subtitle: 'Kategori Layanan Warga',
        iconBg: 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      }
    default:
      return {
        subtitle: 'Kategori Khusus / Portal',
        iconBg: 'bg-sky-50 border-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      }
  }
}

export default function TemplatesTable({ templates }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return templates
    const q = search.toLowerCase()
    return templates.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    )
  }, [templates, search])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Filter & Search Bar Header */}
      <div className="bg-white border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Daftar Template</h3>
        </div>
        <div className="relative w-full sm:w-80">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari template nama atau slug..."
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition shadow-2xs"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Nama Template</th>
              <th className="py-3.5 px-6">Slug Identifier</th>
              <th className="py-3.5 px-6">Deskripsi Ringkas</th>
              <th className="py-3.5 px-6">Website Pengguna</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-700">Tidak ada template ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian yang lain.</p>
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const meta = getTemplateMeta(t.slug)
                const usage = parseInt(t.usage_count || 0, 10)
                const isActive = t.is_active

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition group">
                    {/* 1. Nama Template */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition ${meta.iconBg}`}>
                          {meta.icon}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {meta.subtitle}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Slug Identifier */}
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {t.slug}
                      </span>
                    </td>

                    {/* 3. Deskripsi */}
                    <td className="py-4 px-6 text-slate-600 max-w-xs leading-relaxed">
                      {t.description || '-'}
                    </td>

                    {/* 4. Website Pengguna */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border ${
                          usage > 0
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {usage} Website
                      </span>
                    </td>

                    {/* 5. Status */}
                    <td className="py-4 px-6">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          Non-Aktif
                        </span>
                      )}
                    </td>

                    {/* 6. Aksi */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/templates/${t.id}/edit`}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/50 rounded-lg text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 sm:px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Menampilkan <span className="font-bold text-slate-800">{filtered.length > 0 ? `1-${filtered.length}` : '0'}</span> dari{' '}
          <span className="font-bold text-slate-800">{templates.length}</span> template
        </div>
        <div className="flex items-center gap-2">
          <button disabled className="px-3 py-1 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed bg-white">
            Sebelumnya
          </button>
          <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
            1
          </button>
          <button disabled className="px-3 py-1 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed bg-white">
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  )
}
