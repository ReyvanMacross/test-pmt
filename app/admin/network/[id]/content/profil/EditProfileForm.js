'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveProfileContentAction } from './actions'

export default function EditProfileForm({ website, initialProfile = {} }) {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const formRef = useRef(null)

  // State form
  const [formData, setFormData] = useState({
    bannerTitle: initialProfile.banner_title || '',
    bannerDescription: initialProfile.banner_subtitle || '',
    statLuas: initialProfile.luas_wilayah || '',
    statRW: initialProfile.jumlah_rw || '',
    statRT: initialProfile.jumlah_rt || '',
    statJiwa: initialProfile.total_jiwa || '',
    statKK: initialProfile.jumlah_kk || '',
    statKepuasan: initialProfile.kepuasan_warga || '',
    batasUtara: initialProfile.batas_utara || '',
    batasSelatan: initialProfile.batas_selatan || '',
    batasTimur: initialProfile.batas_timur || '',
    batasBarat: initialProfile.batas_barat || '',
    mapEmbedUrl: initialProfile.maps_embed_url || '',
    visiKecamatan: initialProfile.visi || '',
    misiKecamatan: initialProfile.misi || '',
  })

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success' | 'error', message: string }
  const [isDragging, setIsDragging] = useState(false)

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // ── Unduh Template Excel / CSV ──────────────────────────────────────────────
  function handleDownloadTemplate() {
    const csvContent =
      '\uFEFF' +
      'luas_wilayah,jumlah_rw,jumlah_rt,total_jiwa,jumlah_kk,kepuasan_warga\n' +
      '425.50,12,85,64250,18320,92.5\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `template_demografi_${website.subdomain || 'wilayah'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('success', 'Template tabel berhasil diunduh. Buka dengan Excel, isi angka, lalu unggah kembali.')
  }

  // ── Parse berkas spreadsheet / CSV untuk Auto-Fill ──────────────────────────
  function processSpreadsheetFile(file) {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        if (!text || typeof text !== 'string') {
          showToast('error', 'Format berkas tidak terbaca.')
          return
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
        if (lines.length < 2) {
          showToast('error', 'Berkas kosong atau tidak memiliki baris data.')
          return
        }

        // Parse header baris pertama
        const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ','
        const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))
        const values = lines[1].split(delimiter).map((v) => v.trim().replace(/['"]/g, ''))

        const newStats = {}
        headers.forEach((h, idx) => {
          const val = values[idx] || ''
          if (h.includes('luas')) newStats.statLuas = val
          else if (h.includes('rw')) newStats.statRW = val
          else if (h.includes('rt')) newStats.statRT = val
          else if (h.includes('jiwa') || h.includes('penduduk')) newStats.statJiwa = val
          else if (h.includes('kk') || h.includes('keluarga')) newStats.statKK = val
          else if (h.includes('puas') || h.includes('kepuasan')) newStats.statKepuasan = val
        })

        if (Object.keys(newStats).length > 0) {
          setFormData((prev) => ({ ...prev, ...newStats }))
          showToast('success', 'Data statistik berhasil diekstrak dan mengisi formulir secara otomatis!')
        } else {
          showToast('error', 'Kolom statistik tidak dikenali. Gunakan template yang disediakan.')
        }
      } catch (err) {
        console.error('Error parsing file:', err)
        showToast('error', 'Gagal memproses berkas spreadsheet.')
      }
    }
    reader.readAsText(file)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) processSpreadsheetFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processSpreadsheetFile(file)
  }

  // ── Submit Simpan Profil ───────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData(formRef.current)
      const res = await saveProfileContentAction(website.id, fd)

      if (res?.error) {
        showToast('error', res.error)
      } else {
        showToast('success', res?.message || 'Perubahan profil berhasil disimpan.')
        router.refresh()
      }
    } catch (err) {
      console.error('handleSubmit error:', err)
      showToast('error', 'Terjadi kesalahan sistem saat menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setFormData({
      bannerTitle: initialProfile.banner_title || '',
      bannerDescription: initialProfile.banner_subtitle || '',
      statLuas: initialProfile.luas_wilayah || '',
      statRW: initialProfile.jumlah_rw || '',
      statRT: initialProfile.jumlah_rt || '',
      statJiwa: initialProfile.total_jiwa || '',
      statKK: initialProfile.jumlah_kk || '',
      statKepuasan: initialProfile.kepuasan_warga || '',
      batasUtara: initialProfile.batas_utara || '',
      batasSelatan: initialProfile.batas_selatan || '',
      batasTimur: initialProfile.batas_timur || '',
      batasBarat: initialProfile.batas_barat || '',
      mapEmbedUrl: initialProfile.maps_embed_url || '',
      visiKecamatan: initialProfile.visi || '',
      misiKecamatan: initialProfile.misi || '',
    })
    showToast('success', 'Formulir dikembalikan ke data tersimpan sebelumnya.')
  }

  const domainUrl = `/${website.subdomain || ''}`

  return (
    <div className="w-full space-y-6">
      {/* ── Toast Notification ─────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl border max-w-sm transition-all animate-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-rose-900 text-white border-rose-800'
          }`}
        >
          <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-emerald-400">
            {toast.type === 'success' ? (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {toast.type === 'success' ? 'Berhasil' : 'Pemberitahuan'}
            </p>
            <p className="text-xs mt-0.5 leading-snug text-slate-300">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── PAGE HEADER BAR ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-bold text-2xl text-slate-900 tracking-tight">Edit Konten: Profil</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-slate-700">{website.name}</span>
            <span className="text-slate-400">—</span>
            <a
              className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 font-medium"
              href={domainUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>/{website.subdomain}</span>
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/network/${website.id}/content`}
            className="border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali</span>
          </Link>
        </div>
      </div>

      {/* ── MAIN FORM CONTAINER ────────────────────────────────────────────── */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="border border-slate-200 rounded-2xl shadow-sm bg-white p-6 sm:p-8 space-y-8"
      >
        {/* ── SECTION 1: Informasi Banner Header ──────────────────────────── */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Informasi Banner Header</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pengaturan judul dan deskripsi pembuka pada halaman profil instansi
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="bannerTitle">
                Judul Banner
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="bannerTitle"
                name="bannerTitle"
                placeholder="Masukkan judul banner..."
                type="text"
                value={formData.bannerTitle}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="bannerDescription">
                Deskripsi Singkat Banner
              </label>
              <textarea
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-y"
                id="bannerDescription"
                name="bannerDescription"
                placeholder="Ringkasan singkat mengenai wilayah..."
                rows={3}
                value={formData.bannerDescription}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 2: Statistik & Demografi Wilayah ─────────────────────── */}
        <section className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-semibold text-slate-900">Statistik &amp; Demografi Wilayah</h2>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Auto-Fill Excel
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Data statistik dasar {website.template_name || 'kewilayahan'}
            </p>
          </div>

          <div className="space-y-3 mb-1">
            {/* Info Banner & Tombol Unduh Template */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Gunakan format tabel standar agar data angka otomatis terkalkulasi</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Unduh Template Excel (.xlsx)</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls, text/csv, application/vnd.ms-excel"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Drop Zone Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/40'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">Klik untuk unggah atau tarik file Excel ke sini</p>
              <p className="text-xs text-slate-500 mt-1">File akan dibaca otomatis oleh sistem (Format: .xlsx, .xls, .csv)</p>
            </div>
          </div>

          {/* 6 Grid Kolom Input Demografi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="statLuas">
                Luas Wilayah (Ha)
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="statLuas"
                name="statLuas"
                placeholder="0.00"
                step="0.01"
                type="number"
                value={formData.statLuas}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="statRW">
                Jumlah RW
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="statRW"
                name="statRW"
                placeholder="0"
                type="number"
                value={formData.statRW}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="statRT">
                Jumlah RT
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="statRT"
                name="statRT"
                placeholder="0"
                type="number"
                value={formData.statRT}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="statJiwa">
                Total Jiwa
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="statJiwa"
                name="statJiwa"
                placeholder="0"
                type="number"
                value={formData.statJiwa}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="statKK">
                Jumlah Kepala Keluarga (KK)
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="statKK"
                name="statKK"
                placeholder="0"
                type="number"
                value={formData.statKK}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="statKepuasan">
                Kepuasan Warga (%)
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="statKepuasan"
                max="100"
                min="0"
                name="statKepuasan"
                placeholder="0"
                step="0.1"
                type="number"
                value={formData.statKepuasan}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Batas Wilayah & Peta Lokasi ───────────────────────── */}
        <section className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Batas Wilayah &amp; Peta Lokasi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Batas geografis wilayah kecamatan dan sematan peta interaktif
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="batasUtara">
                Batas Utara
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="batasUtara"
                name="batasUtara"
                placeholder="Nama Kelurahan/Kecamatan"
                type="text"
                value={formData.batasUtara}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="batasSelatan">
                Batas Selatan
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="batasSelatan"
                name="batasSelatan"
                placeholder="Nama Kelurahan/Kecamatan"
                type="text"
                value={formData.batasSelatan}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="batasTimur">
                Batas Timur
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="batasTimur"
                name="batasTimur"
                placeholder="Nama Kelurahan/Kecamatan"
                type="text"
                value={formData.batasTimur}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="batasBarat">
                Batas Barat
              </label>
              <input
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                id="batasBarat"
                name="batasBarat"
                placeholder="Nama Kelurahan/Kecamatan"
                type="text"
                value={formData.batasBarat}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="mapEmbedUrl">
              URL Embed Google Maps
            </label>
            <input
              className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              id="mapEmbedUrl"
              name="mapEmbedUrl"
              placeholder="https://www.google.com/maps/embed?..."
              type="url"
              value={formData.mapEmbedUrl}
              onChange={handleInputChange}
            />
          </div>
        </section>

        {/* ── SECTION 4: Visi & Misi ───────────────────────────────────────── */}
        <section className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Visi &amp; Misi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visi pembangunan jangka menengah dan misi strategis instansi
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="visiKecamatan">
                Visi
              </label>
              <textarea
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-y"
                id="visiKecamatan"
                name="visiKecamatan"
                placeholder="Tuliskan visi kecamatan..."
                rows={3}
                value={formData.visiKecamatan}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="misiKecamatan">
                Misi
              </label>
              <textarea
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-y"
                id="misiKecamatan"
                name="misiKecamatan"
                placeholder="Tuliskan poin-poin misi per baris..."
                rows={4}
                value={formData.misiKecamatan}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        {/* ── BOTTOM ACTIONS ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Simpan Profil</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
