'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CONTENT_MODULES } from '@/lib/content-modules'
import { saveModuleContentAction } from './actions'

// ─── SVG Ikon untuk setiap modul ──────────────────────────────────────────────
function ModuleIcon({ name }) {
  switch (name) {
    case 'home':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    case 'description':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'assignment':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    case 'account_tree':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      )
    case 'badge':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      )
    case 'room_service':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11H6m14-4a8 8 0 00-16 0h16zm-8-7a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      )
    case 'contact_phone':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    case 'verified_user':
    case 'security':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    case 'table_chart':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'lock':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    case 'calendar_month':
    case 'event':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'schedule':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'warning':
    case 'report_problem':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    case 'inbox':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )
    case 'lightbulb':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    case 'newspaper':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    case 'collections':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'video_library':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    case 'info':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'campaign':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

export default function ContentModulesClient({ website, existingContents = {} }) {
  const [currentCategory, setCurrentCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [activeModalModule, setActiveModalModule] = useState(null)
  const [contentMap, setContentMap] = useState(existingContents)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)

  function isModuleFilled(item) {
    return Boolean(item?.has_content || item?.title?.trim() || item?.body?.trim() || item?.has_images || item?.has_files)
  }

  // Total modul
  const totalModules = CONTENT_MODULES.length // 23

  // Status Sinkronisasi: Hitung modul unik yang sudah diinput/diedit (default 0 jika belum ada yang diinput)
  const filledCount = useMemo(() => {
    return CONTENT_MODULES.filter((module) => isModuleFilled(contentMap[module.slug])).length
  }, [contentMap])

  const completionPercent = Math.min(100, Math.round((filledCount / totalModules) * 100))
  const neededCount = Math.max(0, totalModules - filledCount)

  // Filter modules berdasarkan kategori & search
  const filteredModules = useMemo(() => {
    let list = CONTENT_MODULES
    if (currentCategory !== 'all') {
      list = list.filter((m) => m.category === currentCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.categoryLabel.toLowerCase().includes(q)
      )
    }
    return list
  }, [currentCategory, search])

  // Hitung jumlah modul per kategori tab
  const countUtama = CONTENT_MODULES.filter((m) => m.category === 'utama').length
  const countPpid = CONTENT_MODULES.filter((m) => m.category === 'ppid').length
  const countBerita = CONTENT_MODULES.filter((m) => m.category === 'berita').length

  function handleOpenModal(mod) {
    setActiveModalModule(mod)
    setSaveSuccess(false)
    setSaveError(null)
  }

  function handleCloseModal() {
    setActiveModalModule(null)
    setSaveSuccess(false)
    setSaveError(null)
  }

  async function handleSaveContent(e) {
    e.preventDefault()
    if (!activeModalModule) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const formData = new FormData(e.currentTarget)
    const titleVal = formData.get('title')?.trim()
    const bodyVal = formData.get('body')?.trim()

    try {
      const res = await saveModuleContentAction(website.id, activeModalModule.slug, formData)

      if (res?.error) {
        setSaveError(res.error)
        setSaving(false)
      } else {
        const uploadedFile = formData.get('file')
        const removedFile = formData.get('remove_file') === 'true'
        setContentMap((prev) => {
          const previous = prev[activeModalModule.slug] || {}
          const hasFile = removedFile ? false : Boolean(previous.has_files || previous.has_images || (uploadedFile && uploadedFile.size > 0))
          return {
            ...prev,
            [activeModalModule.slug]: {
              ...previous,
              title: titleVal,
              body: bodyVal,
              has_files: hasFile && !uploadedFile?.type?.startsWith('image/'),
              has_images: hasFile && Boolean(uploadedFile?.type?.startsWith('image/') || previous.has_images),
              has_content: Boolean(titleVal || bodyVal || hasFile),
            },
          }
        })
        setSaving(false)
        setSaveSuccess(true)
        setTimeout(() => {
          handleCloseModal()
        }, 1000)
      }
    } catch (error) {
      setSaveError(error.message || 'Gagal menyimpan konten. Silakan coba lagi.')
      setSaving(false)
    }
  }

  return (
    <>
      {/* ── Content Health / Completion Metric Widget ──────────────── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-800">Kelengkapan Konten Portal</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                filledCount > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                Tingkat Isi: {completionPercent}%
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-800 font-semibold">
                {filledCount} dari {totalModules} modul telah terisi ({neededCount} belum terisi).
              </strong>{' '}
              {filledCount === 0
                ? 'Belum ada modul yang diisi. Mulai dengan mengisi modul Beranda, Profil, Kontak, atau PPID untuk mengaktifkan portal perangkat daerah.'
                : 'Lengkapi modul PPID, Profil Pimpinan, dan Agenda Wilayah sebelum verifikasi keterbukaan informasi publik semesteran oleh Diskominfo.'}
            </p>
          </div>
        </div>

        {/* Status Sinkronisasi Box */}
        <div className="flex flex-col min-w-[280px] sm:min-w-[340px] space-y-2.5 bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              Status Sinkronisasi
            </span>
            <span className="font-bold text-blue-600 text-sm">
              {filledCount} dari {totalModules} Modul
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <span className={`w-1.5 h-1.5 rounded-full ${filledCount > 0 ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
              {filledCount} Lengkap
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {neededCount} Diperlukan
            </span>
          </div>
        </div>
      </div>

      {/* ── 1. TOP SEARCH & TAB CONTROLS (FULL WIDTH STACKED) ──────────────── */}
      <div className="flex flex-col gap-3.5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        {/* Row 1: Search Input */}
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu atau konten..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
          />
        </div>

        {/* Row 2: Full-width Segmented Category Tab Bar */}
        <div className="w-full bg-slate-100 p-1.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentCategory('all')}
            className={`w-full py-2.5 px-3 rounded-lg text-xs text-center transition-all flex items-center justify-center cursor-pointer ${
              currentCategory === 'all'
                ? 'bg-white text-blue-700 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
            }`}
          >
            Semua Modul ({CONTENT_MODULES.length})
          </button>
          <button
            type="button"
            onClick={() => setCurrentCategory('utama')}
            className={`w-full py-2.5 px-3 rounded-lg text-xs text-center transition-all flex items-center justify-center cursor-pointer ${
              currentCategory === 'utama'
                ? 'bg-white text-blue-700 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
            }`}
          >
            Halaman Utama &amp; Profil ({countUtama})
          </button>
          <button
            type="button"
            onClick={() => setCurrentCategory('ppid')}
            className={`w-full py-2.5 px-3 rounded-lg text-xs text-center transition-all flex items-center justify-center cursor-pointer ${
              currentCategory === 'ppid'
                ? 'bg-white text-blue-700 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
            }`}
          >
            Informasi Publik &amp; PPID ({countPpid})
          </button>
          <button
            type="button"
            onClick={() => setCurrentCategory('berita')}
            className={`w-full py-2.5 px-3 rounded-lg text-xs text-center transition-all flex items-center justify-center cursor-pointer ${
              currentCategory === 'berita'
                ? 'bg-white text-blue-700 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
            }`}
          >
            Berita &amp; Media ({countBerita})
          </button>
        </div>
      </div>

      {/* ── 2. UNIFIED CONTENT CONTAINER (SEMUA 23 MODUL DITAMPILKAN PENUH TANPA INNER SCROLL) ─ */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        {filteredModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-700">
              Tidak ada modul yang cocok dengan pencarian Anda.
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Periksa kembali kata kunci pencarian Anda atau pilih kategori lain.
            </p>
          </div>
        ) : (
          /* Tampilkan semua modul dalam 2 kolom tanpa scroll wrapper */
          <div id="modulesContainer" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModules.map((mod) => {
              const contentData = contentMap[mod.slug]
              const isFilled = isModuleFilled(contentData)

              return (
                <div
                  key={mod.slug}
                  className="group bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl ${mod.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <ModuleIcon name={mod.iconName} />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {mod.title}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${isFilled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                        title={isFilled ? 'Modul telah terisi konten' : 'Modul belum memiliki konten'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isFilled ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                        {isFilled ? 'Terisi' : 'Kosong'}
                      </span>
                    </div>
                  </div>
                    {mod.actionType === 'Edit' || ['berita', 'galeri-gambar', 'galeri-video', 'pengumuman', 'inovasi', 'agenda-kegiatan', 'layanan'].includes(mod.slug) ? (
                    <Link
                      href={
                          mod.slug === 'berita'
                            ? `/admin/network/${website.id}/content/berita`
                            : mod.slug === 'galeri-gambar'
                              ? `/admin/network/${website.id}/content/galeri-gambar`
                              : mod.slug === 'galeri-video'
                                ? `/admin/network/${website.id}/content/galeri-video`
                                : mod.slug === 'pengumuman'
                                  ? `/admin/network/${website.id}/content/pengumuman`
                                  : mod.slug === 'inovasi'
                                    ? `/admin/network/${website.id}/content/inovasi`
                                    : mod.slug === 'agenda-kegiatan'
                                      ? `/admin/network/${website.id}/content/agenda-kegiatan`
                                      : mod.slug === 'layanan'
                                        ? `/admin/network/${website.id}/content/layanan`
                              : `/admin/network/${website.id}/content/${mod.slug}`
                      }
                      className="text-xs font-semibold px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-white hover:text-blue-700 hover:border-blue-500 shrink-0 whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {mod.actionType}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenModal(mod)}
                      className="text-xs font-semibold px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-white hover:text-blue-700 hover:border-blue-500 shrink-0 whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {mod.actionType}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 3. INTERACTIVE MODAL EDIT / KELOLA MODUL KONTEN ───────────────── */}
      {activeModalModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${activeModalModule.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <ModuleIcon name={activeModalModule.iconName} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Sunting Modul: {activeModalModule.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeModalModule.categoryLabel} — {website.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Notification messages */}
            {saveSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Konten berhasil disimpan dan status sinkronisasi diperbarui.</span>
              </div>
            )}

            {saveError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{saveError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveContent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Modul / Header
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={contentMap[activeModalModule.slug]?.title || activeModalModule.title}
                  required
                  placeholder={`Contoh: ${activeModalModule.title} ${website.name}`}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Isi Konten / Deskripsi Informasi
                </label>
                <textarea
                  name="body"
                  rows={6}
                  defaultValue={contentMap[activeModalModule.slug]?.body || ''}
                  placeholder={`Tuliskan isi atau ringkasan informasi modul ${activeModalModule.title}...`}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-y"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Konten ini akan dipublikasikan pada halaman publik /{website.subdomain}.
                </p>
              </div>

              {/* Footer Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
