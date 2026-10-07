'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveModuleContentAction } from '../actions'

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function EditModuleContentForm({ website, moduleMeta, initialContent = {} }) {
  const router = useRouter()
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)

  // Tentukan konfigurasi label dan panduan modul
  const moduleConfig = (() => {
    switch (moduleMeta.slug) {
      case 'struktur-organisasi':
        return {
          sectionTitle: 'Informasi & Bagan Struktur Organisasi',
          sectionDesc: 'Pengaturan naskah dan unggah berkas gambar bagan struktur organisasi instansi',
          uploadLabel: 'Gambar Bagan Struktur Organisasi',
          uploadHint: 'Unggah File Gambar Bagan (PNG, JPG, WEBP - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp',
          defaultTitle: `Struktur Organisasi ${website.name || ''}`.trim(),
        }
      case 'profil-pimpinan':
        return {
          sectionTitle: 'Informasi & Foto Profil Pimpinan',
          sectionDesc: 'Pengaturan naskah dan unggah foto profil pimpinan instansi',
          uploadLabel: 'Foto Profil Pimpinan',
          uploadHint: 'Unggah Foto Pimpinan (PNG, JPG, WEBP - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp',
          defaultTitle: `Profil Pimpinan ${website.name || ''}`.trim(),
        }
      case 'ppid':
        return {
          sectionTitle: 'Informasi & Bagan Pengelola PPID',
          sectionDesc: 'Pengaturan naskah profil PPID dan bagan alur/struktur pengelola PPID',
          uploadLabel: 'Gambar Bagan Alur / Berkas PPID',
          uploadHint: 'Unggah Berkas / Bagan PPID (PNG, JPG, WEBP, PDF - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `PPID ${website.name || ''}`.trim(),
        }
      case 'daftar-informasi-publik':
        return {
          sectionTitle: 'Informasi & Dokumen Daftar Informasi Publik',
          sectionDesc: 'Pengaturan naskah ringkasan dan berkas dokumen penetapan DIP',
          uploadLabel: 'Dokumen / Gambar Pendukung DIP',
          uploadHint: 'Unggah Berkas Dokumen / Bagan DIP (PNG, JPG, WEBP, PDF - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `Daftar Informasi Publik ${website.name || ''}`.trim(),
        }
      case 'daftar-informasi-dikecualikan':
        return {
          sectionTitle: 'Informasi & Dokumen Penetapan Informasi Dikecualikan',
          sectionDesc: 'Pengaturan naskah dan berkas dokumen surat ketetapan uji konsekuensi',
          uploadLabel: 'Dokumen / Gambar Surat Penetapan',
          uploadHint: 'Unggah Berkas Ketetapan / Bagan (PNG, JPG, WEBP, PDF - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `Daftar Informasi Dikecualikan ${website.name || ''}`.trim(),
        }
      case 'ppid-utama':
        return {
          sectionTitle: 'Informasi & Integrasi Portal PPID Utama',
          sectionDesc: 'Pengaturan tautan, naskah integrasi dan berkas pedoman PPID Utama Kota Bandung',
          uploadLabel: 'Dokumen / Pedoman / Banner PPID Utama',
          uploadHint: 'Unggah Berkas / Banner (PNG, JPG, WEBP, PDF - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `PPID Utama ${website.name || ''}`.trim(),
        }
      case 'informasi-wajib-berkala':
        return {
          sectionTitle: 'Informasi & Dokumen Informasi Wajib Berkala',
          sectionDesc: 'Pengaturan naskah laporan keuangan, RKA/DPA, LAKIP, dan dokumen berkala instansi',
          uploadLabel: 'Dokumen / Berkas Informasi Wajib Berkala',
          uploadHint: 'Unggah Berkas Dokumen (PDF, PNG, JPG, WEBP - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `Informasi Wajib Berkala ${website.name || ''}`.trim(),
        }
      case 'informasi-tersedia-setiap-saat':
        return {
          sectionTitle: 'Informasi & Dokumen Informasi Tersedia Setiap Saat',
          sectionDesc: 'Pengaturan naskah regulasi, SOP, perjanjian kerjasama, dan daftar aset instansi',
          uploadLabel: 'Dokumen / Berkas Informasi Tersedia Setiap Saat',
          uploadHint: 'Unggah Berkas Dokumen (PDF, PNG, JPG, WEBP - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `Informasi Tersedia Setiap Saat ${website.name || ''}`.trim(),
        }
      case 'informasi-serta-merta':
        return {
          sectionTitle: 'Informasi & Dokumen Informasi Serta Merta',
          sectionDesc: 'Pengaturan naskah pengumuman darurat, mitigasi bencana, dan informasi keselamatan publik',
          uploadLabel: 'Dokumen / Berkas Informasi Serta Merta',
          uploadHint: 'Unggah Berkas Dokumen / Infografis (PDF, PNG, JPG, WEBP - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `Informasi Serta Merta ${website.name || ''}`.trim(),
        }
      case 'permohonan-informasi-online':
        return {
          sectionTitle: 'Informasi & Alur Permohonan Informasi Online',
          sectionDesc: 'Pengaturan alur permohonan daring, SOP tata cara, dan berkas formulir permohonan',
          uploadLabel: 'Formulir / Bagan Prosedur Permohonan Informasi',
          uploadHint: 'Unggah Formulir / Bagan Prosedur (PDF, PNG, JPG, WEBP - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `Permohonan Informasi Online ${website.name || ''}`.trim(),
        }
      case 'pengajuan-keberatan-online':
        return {
          sectionTitle: 'Informasi & Alur Pengajuan Keberatan Online',
          sectionDesc: 'Pengaturan naskah layanan keberatan informasi publik dan berkas formulir pengajuan keberatan',
          uploadLabel: 'Formulir / Bagan Prosedur Pengajuan Keberatan',
          uploadHint: 'Unggah Formulir / Bagan Keberatan (PDF, PNG, JPG, WEBP - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `Pengajuan Keberatan Online ${website.name || ''}`.trim(),
        }
      case 'informasi':
        return {
          sectionTitle: 'Informasi & Berkas Infografis / Publikasi',
          sectionDesc: 'Pengaturan naskah umum dan infografis publikasi',
          uploadLabel: 'Infografis / Gambar Pendukung',
          uploadHint: 'Unggah File Gambar / Infografis (PNG, JPG, WEBP - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp',
          defaultTitle: `Informasi Publikasi ${website.name || ''}`.trim(),
        }
      default:
        return {
          sectionTitle: `Informasi & Berkas ${moduleMeta.title}`,
          sectionDesc: `Pengaturan naskah dan unggah berkas gambar / dokumen pendukung ${moduleMeta.title.toLowerCase()} instansi`,
          uploadLabel: `Gambar / Berkas Pendukung ${moduleMeta.title}`,
          uploadHint: 'Unggah File Pendukung (PNG, JPG, WEBP, PDF - Maks. 5MB)',
          accept: 'image/png, image/jpeg, image/jpg, image/webp, application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          defaultTitle: `${moduleMeta.title} ${website.name || ''}`.trim(),
        }
    }
  })()

  // Initial values
  const initialTitle = initialContent.title || moduleConfig.defaultTitle || ''
  const initialBody = initialContent.body || ''
  const existingAttachment =
    (Array.isArray(initialContent.images) && initialContent.images[0]) ||
    (Array.isArray(initialContent.files) && initialContent.files[0]) ||
    null

  const [title, setTitle] = useState(initialTitle)
  const [bodyHtml, setBodyHtml] = useState(initialBody)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(existingAttachment?.url || null)
  const [isRemovedFile, setIsRemovedFile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Inisialisasi editor content saat mount
  useEffect(() => {
    if (editorRef.current && initialBody) {
      editorRef.current.innerHTML = initialBody
    }
  }, [initialBody])

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Formatting commands untuk toolbar
  function formatDoc(cmd, value = null) {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(cmd, false, value)
    setBodyHtml(editorRef.current.innerHTML)
  }

  function handleInsertLink() {
    const url = prompt('Masukkan URL tautan (contoh: https://...):')
    if (url) {
      formatDoc('createLink', url)
    }
  }

  function handleEditorInput() {
    if (editorRef.current) {
      setBodyHtml(editorRef.current.innerHTML)
    }
  }

  function handleFileSelected(file) {
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Ukuran berkas melebihi batas maksimal 5MB.')
      return
    }

    setSelectedFile(file)
    setIsRemovedFile(false)

    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file)
      setFilePreview(objectUrl)
    } else {
      setFilePreview(null)
    }
  }

  function handleFileInputChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    setFilePreview(null)
    setIsRemovedFile(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleReset() {
    setTitle(initialTitle)
    setBodyHtml(initialBody)
    if (editorRef.current) {
      editorRef.current.innerHTML = initialBody
    }
    setSelectedFile(null)
    setFilePreview(existingAttachment?.url || null)
    setIsRemovedFile(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    showToast('success', 'Formulir dikembalikan ke konten tersimpan.')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData()
      fd.set('title', title)
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : bodyHtml
      fd.set('body', currentHtml)

      if (selectedFile) {
        fd.set('file', selectedFile)
      } else if (isRemovedFile) {
        fd.set('remove_file', 'true')
      }

      const res = await saveModuleContentAction(website.id, moduleMeta.slug, fd)

      if (res?.error) {
        showToast('error', res.error)
      } else {
        showToast('success', `Perubahan ${moduleMeta.title.toLowerCase()} berhasil disimpan.`)
        router.refresh()
      }
    } catch (err) {
      console.error('handleSubmit error:', err)
      showToast('error', 'Terjadi kesalahan sistem saat menyimpan konten.')
    } finally {
      setSaving(false)
    }
  }

  // Active file info untuk preview
  const currentFileName = selectedFile
    ? selectedFile.name
    : !isRemovedFile && existingAttachment
    ? existingAttachment.name || 'Berkas Terunggah'
    : null

  const currentFileSize = selectedFile
    ? formatBytes(selectedFile.size)
    : !isRemovedFile && existingAttachment?.size
    ? formatBytes(existingAttachment.size)
    : null

  const isImageFile = Boolean(
    (selectedFile && selectedFile.type?.startsWith('image/')) ||
    (!isRemovedFile && existingAttachment && (existingAttachment.type?.startsWith('image/') || existingAttachment.url?.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)))
  )

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── TOP BANNER CARD ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Edit Konten: {moduleMeta.title}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{website.name}</span>
            <span className="text-slate-400">—</span>
            <a
              className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
              href={domainUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>{domainUrl}</span>
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
        <div>
          <Link
            href={`/admin/network/${website.id}/content`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali</span>
          </Link>
        </div>
      </div>

      {/* ── MAIN CONTENT FORM CARD ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1 pb-2 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {moduleConfig.sectionTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {moduleConfig.sectionDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Judul Konten */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2" htmlFor="judul_konten">
              Judul Konten
            </label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400 transition shadow-xs"
              id="judul_konten"
              name="judul_konten"
              placeholder="Masukkan judul konten..."
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 2. Upload Berkas / Gambar Dropzone */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              {moduleConfig.uploadLabel}
            </label>

            {currentFileName && !isRemovedFile ? (
              /* Tampilan Preview File / Gambar yang Sudah Ada / Dipilih */
              <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                  {isImageFile && filePreview ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center shadow-xs">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate" title={currentFileName}>
                      {currentFileName}
                    </p>
                    {currentFileSize && (
                      <p className="text-xs text-slate-500 mt-0.5">{currentFileSize}</p>
                    )}
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {selectedFile ? 'Berkas baru dipilih' : 'Berkas tersimpan di database'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    Ganti Berkas
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone Kosong */
              <div
                id="dropzoneArea"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative group border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  accept={moduleConfig.accept}
                  className="hidden"
                  id="fileInput"
                  type="file"
                  onChange={handleFileInputChange}
                />
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    {moduleConfig.uploadHint}
                  </p>
                  <p className="text-xs text-slate-500">
                    Klik untuk memilih berkas atau seret ke sini
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Isi Konten dengan Toolbar */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block" htmlFor="editorArea">
              Isi Konten
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-blue-600">
              {/* Rich Editor Toolbar */}
              <div className="flex items-center flex-wrap gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
                {/* Bold */}
                <button
                  type="button"
                  onClick={() => formatDoc('bold')}
                  title="Bold (Ctrl+B)"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                  </svg>
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => formatDoc('italic')}
                  title="Italic (Ctrl+I)"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4h4m-2 0l-4 16m2 0h4" />
                  </svg>
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onClick={() => formatDoc('underline')}
                  title="Underline (Ctrl+U)"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 3v7a6 6 0 0012 0V3M4 21h16" />
                  </svg>
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                {/* Bullet List */}
                <button
                  type="button"
                  onClick={() => formatDoc('insertUnorderedList')}
                  title="Bullet List"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h.01M4 12h.01M4 18h.01M9 6h11M9 12h11M9 18h11" />
                  </svg>
                </button>

                {/* Numbered List */}
                <button
                  type="button"
                  onClick={() => formatDoc('insertOrderedList')}
                  title="Numbered List"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 6h13M7 12h13M7 18h13M3 5v3m0 0h2M3 11h1.5a1.5 1.5 0 011.5 1.5V13a1 1 0 01-1 1H3m0 4h2a1 1 0 001-1v-.5a1.5 1.5 0 00-1.5-1.5H3" />
                  </svg>
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1"></div>

                {/* Link */}
                <button
                  type="button"
                  onClick={handleInsertLink}
                  title="Insert Link"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>

                {/* Remove Formatting */}
                <button
                  type="button"
                  onClick={() => formatDoc('removeFormat')}
                  title="Remove Formatting"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Editor Canvas (ContentEditable Area) */}
              <div
                ref={editorRef}
                id="editorArea"
                contentEditable
                onInput={handleEditorInput}
                className="min-h-[220px] p-4 bg-white text-sm text-slate-800 focus:outline-none leading-relaxed prose prose-sm max-w-none"
                data-placeholder="Ketikkan isi konten di sini..."
              />
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    #editorArea:empty:before {
                      content: attr(data-placeholder);
                      color: #94a3b8;
                      font-style: italic;
                      pointer-events: none;
                    }
                  `,
                }}
              />
            </div>
          </div>

          {/* 4. Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Simpan {moduleMeta.title}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
