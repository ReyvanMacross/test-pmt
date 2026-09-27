'use client'

import { useState } from 'react'
import { createWebsiteAction } from './actions'

export default function CreateWebsiteModal({ isOpen, onClose, templates }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates?.find((t) => t.slug === 'dinas')?.id || templates?.[0]?.id || ''
  )
  const [category, setCategory] = useState('dinas')

  if (!isOpen) return null

  // Auto-slug dari nama website
  function handleNameChange(e) {
    const val = e.target.value
    setName(val)
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setSubdomain(slug)
  }

  // Jika kategori berubah, pilih template yang sesuai
  function handleCategoryChange(e) {
    const cat = e.target.value
    setCategory(cat)
    const matched = templates?.find((t) => t.slug === cat)
    if (matched) {
      setSelectedTemplateId(matched.id)
    }
  }

  // Jika kartu template diklik
  function handleTemplateSelect(tpl) {
    setSelectedTemplateId(tpl.id)
    setCategory(tpl.slug)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    // Pastikan template_id terpilih
    formData.set('template_id', selectedTemplateId)

    const res = await createWebsiteAction(formData)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      // Sukses: tutup modal dan reset form
      setLoading(false)
      setName('')
      setSubdomain('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* ── Modal Card Container ────────────────────────────────────────── */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 p-7 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Deploy Website Baru
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pilih template dan masukkan identitas perangkat daerah untuk deployment instan.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"></line>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ── Form Modal ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Nama Perangkat Daerah */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="modal-name">
              NAMA PERANGKAT DAERAH <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="modal-name"
              name="name"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="Contoh: Dinas Komunikasi dan Informatika"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>

          {/* 2. Row: Kategori & Subdomain / Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori / Tipe */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="modal-category">
                KATEGORI / TIPE <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="modal-category"
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer pr-10"
                >
                  <option value="dinas">Dinas &amp; Badan</option>
                  <option value="kecamatan">Kecamatan</option>
                  <option value="kelurahan">Kelurahan</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Subdomain / Slug */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="modal-subdomain">
                SUBDOMAIN / SLUG <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <span className="bg-slate-100 text-slate-500 px-3.5 py-3 text-sm font-mono border-r border-slate-200 select-none">
                  /
                </span>
                <input
                  type="text"
                  id="modal-subdomain"
                  name="subdomain"
                  required
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="diskominfo"
                  className="w-full px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 font-mono outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Pilihan Template Website */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                PILIH TEMPLATE WEBSITE <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Preview Template →
              </button>
            </div>

            {/* Hidden Input for Form Data */}
            <input type="hidden" name="template_id" value={selectedTemplateId} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map((tpl) => {
                const isSelected = String(tpl.id) === String(selectedTemplateId)
                const isDinas = tpl.slug === 'dinas'
                const isKec = tpl.slug === 'kecamatan'
                const isKel = tpl.slug === 'kelurahan'

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleTemplateSelect(tpl)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-2 border-blue-600 bg-blue-50/20 shadow-xs ring-2 ring-blue-600/10'
                        : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon & Checkmark Indicator */}
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                            isDinas
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : isKec
                              ? 'bg-teal-50 text-teal-600 border-teal-100'
                              : 'bg-lime-50 text-lime-700 border-lime-100'
                          }`}
                        >
                          {isDinas ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                            </svg>
                          ) : isKec ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                            </svg>
                          )}
                        </div>

                        {/* Radio Check Circle */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'border-2 border-slate-300'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {tpl.name}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      {isDinas
                        ? 'Fokus pada publikasi regulasi, transparansi kinerja, dan portal berita.'
                        : isKec
                        ? 'Optimal untuk layanan kependudukan, pengumuman, dan aspirasi warga.'
                        : 'Direktori potensi wilayah, agenda RW/RT, dan akses layanan cepat.'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. Deployment Info Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-slate-600">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="leading-relaxed m-0">
              Deployment otomatis akan menginisiasi database tenant baru, menerapkan konfigurasi domain Pemkot Bandung, dan membuat akun pengelola awal untuk OPD terkait.
            </p>
          </div>

          {/* ── Modal Footer Buttons ──────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Mendeploy...</span>
                </>
              ) : (
                <>
                  <span>+</span>
                  <span>Deploy Website Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
