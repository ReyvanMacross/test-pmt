'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Check, Download, ExternalLink, FileText, Pencil, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react'
import { deletePublicDocumentItemAction, savePublicDocumentIntroductionAction, savePublicDocumentItemAction } from '../actions'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15'
const documentModules = new Set(['ppid','ppid-utama','daftar-informasi-publik','daftar-informasi-dikecualikan','informasi-wajib-berkala','informasi-tersedia-setiap-saat','informasi-serta-merta','permohonan-informasi-online','pengajuan-keberatan-online'])

function formatMonth(value) {
  if (!value) return 'Tanggal pembaruan belum diisi'
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

export default function PublicDocumentManager({ website, moduleMeta, initialContent }) {
  const router = useRouter()
  const [documents, setDocuments] = useState(Array.isArray(initialContent.metadata?.public_documents) ? initialContent.metadata.public_documents : [])
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [busy, startTransition] = useTransition()
  const [notice, setNotice] = useState(null)
  const [introTitle, setIntroTitle] = useState(initialContent.title || '')
  const [introBody, setIntroBody] = useState(initialContent.body || '')
  const [externalUrl, setExternalUrl] = useState(initialContent.metadata?.external_url || '')
  const editingDocument = documents.find((item) => item.id === editingId)
  const filteredDocuments = useMemo(() => documents.filter((item) => `${item.title} ${item.description || ''}`.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID'))), [documents, search])

  function notify(type, message) {
    setNotice({ type, message })
    window.setTimeout(() => setNotice(null), 5000)
  }

  async function saveIntroduction(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await savePublicDocumentIntroductionAction(website.id, moduleMeta.slug, data)
      if (result.error) notify('error', result.error)
      else { notify('success', result.message); router.refresh() }
    })
  }

  async function saveDocument(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (editingId) data.set('document_id', editingId)
    startTransition(async () => {
      const result = await savePublicDocumentItemAction(website.id, moduleMeta.slug, data)
      if (result.error) { notify('error', result.error); return }
      setDocuments((current) => editingId ? current.map((item) => item.id === editingId ? result.document : item) : [result.document, ...current])
      setEditingId(null)
      form.reset()
      notify('success', result.message)
      router.refresh()
    })
  }

  function deleteDocument(id) {
    if (!window.confirm('Hapus dokumen ini dari daftar publikasi?')) return
    startTransition(async () => {
      const result = await deletePublicDocumentItemAction(website.id, moduleMeta.slug, id)
      if (result.error) { notify('error', result.error); return }
      setDocuments((current) => current.filter((item) => item.id !== id))
      if (editingId === id) setEditingId(null)
      notify('success', 'Dokumen berhasil dihapus.')
      router.refresh()
    })
  }

  function resetDocumentForm() {
    setEditingId(null)
    document.getElementById('public-document-form')?.reset()
  }

  return <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-9">
    {notice && <div role="status" className={`fixed right-4 top-20 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><span className="mt-0.5">{notice.type === 'error' ? <X className="h-4 w-4"/> : <Check className="h-4 w-4"/>}</span>{notice.message}</div>}

    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-700">Kelola Konten · Informasi Publik</p><h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Kelola {moduleMeta.title}</h1><p className="mt-2 text-xs text-slate-500">{website.name} <span className="mx-1">·</span> {moduleMeta.description}</p></div>
      <a href={`/${website.subdomain}/ppid`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"><ExternalLink className="h-4 w-4"/>Pratinjau Arsip</a>
    </section>

    <form onSubmit={saveIntroduction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-extrabold text-slate-900">Informasi pengantar modul</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Judul dan ringkasan pengantar untuk halaman kategori ini. Isian ini tetap tampil terpisah dari daftar berkas.</p></div>
      <div><label htmlFor="intro-title" className="mb-2 block text-sm font-semibold text-slate-700">Judul / nama informasi</label><input id="intro-title" name="title" value={introTitle} onChange={(event) => setIntroTitle(event.target.value)} maxLength={255} className={inputClass} placeholder={`Contoh: ${moduleMeta.title} ${website.name}`}/></div>
      <div><label htmlFor="intro-body" className="mb-2 block text-sm font-semibold text-slate-700">Ringkasan / tata cara informasi</label><textarea id="intro-body" name="body" value={introBody} onChange={(event) => setIntroBody(event.target.value)} rows={4} maxLength={20000} className={`${inputClass} min-h-28 resize-y leading-6`} placeholder="Tuliskan penjelasan singkat untuk masyarakat..."/></div>
      {moduleMeta.slug === 'ppid-utama' && <div><label htmlFor="external-url" className="mb-2 block text-sm font-semibold text-slate-700">Tautan portal PPID Utama</label><input id="external-url" name="external_url" type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} maxLength={2000} className={inputClass} placeholder="https://ppid.bandung.go.id/"/><p className="mt-1.5 text-xs text-slate-500">Gunakan alamat HTTPS resmi.</p></div>}
      <div className="flex justify-end border-t border-slate-100 pt-4"><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Check className="h-4 w-4"/>{busy ? 'Menyimpan...' : 'Simpan Informasi'}</button></div>
    </form>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
      <form id="public-document-form" onSubmit={saveDocument} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="border-b border-slate-100 pb-4"><span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">{editingDocument ? 'Edit Dokumen' : 'Dokumen Baru'}</span><h2 className="mt-2 text-base font-extrabold text-slate-900">{editingDocument ? 'Perbarui dokumen publik' : `Tambah ${moduleMeta.title} Baru`}</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Tambahkan judul, ringkasan, tanggal pembaruan, dan berkas PDF untuk ditampilkan pada arsip publik.</p></div>
        <input type="hidden" name="document_id" value={editingId || ''}/>
        <div><label htmlFor="document-title" className="mb-2 block text-sm font-semibold text-slate-700">Judul Dokumen <span className="text-rose-500">*</span></label><input id="document-title" name="document_title" required maxLength={255} defaultValue={editingDocument?.title || ''} key={`title-${editingId || 'new'}`} className={inputClass} placeholder="Contoh: Daftar Informasi Publik Kecamatan"/></div>
        <div><label htmlFor="document-description" className="mb-2 block text-sm font-semibold text-slate-700">Deskripsi Ringkas Dokumen</label><textarea id="document-description" name="document_description" rows={3} maxLength={4000} defaultValue={editingDocument?.description || ''} key={`description-${editingId || 'new'}`} className={`${inputClass} resize-y leading-6`} placeholder="Ringkasan isi atau cakupan dokumen..."/></div>
        <div><label htmlFor="revision-month" className="mb-2 block text-sm font-semibold text-slate-700">Bulan / Tahun Diperbarui <span className="text-rose-500">*</span></label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input id="revision-month" name="revision_month" type="month" required defaultValue={editingDocument?.revision_month || ''} key={`month-${editingId || 'new'}`} className={`${inputClass} pl-10`}/></div></div>
        <div><label htmlFor="document-file" className="mb-2 block text-sm font-semibold text-slate-700">Berkas Dokumen (PDF) {!editingDocument && <span className="text-rose-500">*</span>}</label><label htmlFor="document-file" className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"><UploadCloud className="h-7 w-7 text-blue-600"/><span className="mt-2 text-sm font-semibold text-slate-700">Klik untuk memilih berkas PDF</span><span className="mt-1 max-w-full truncate text-xs text-slate-500">{editingDocument?.attachment?.name || 'PDF · Maksimal 10 MB'}</span><input id="document-file" name="document_file" type="file" accept="application/pdf,.pdf" required={!editingDocument} className="sr-only" key={`file-${editingId || 'new'}`}/></label>{editingDocument && <p className="mt-2 text-xs text-slate-500">Berkas yang ada tetap dipakai jika tidak memilih file pengganti.</p>}</div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">{editingDocument && <button type="button" onClick={resetDocumentForm} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><X className="h-4 w-4"/>Batal</button>}<button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Plus className="h-4 w-4"/>{busy ? 'Menyimpan...' : editingDocument ? 'Simpan Perubahan' : 'Tambah Dokumen'}</button></div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-base font-extrabold text-slate-900">Daftar Dokumen Dipublikasikan</h2><p className="mt-1 text-xs text-slate-500">{documents.length} dokumen tersimpan pada kategori ini.</p></div><label className="relative block w-full sm:max-w-56"><span className="sr-only">Cari dokumen</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} py-2 pl-9 text-xs`} placeholder="Cari dokumen..."/></label></div>
        <div className="space-y-3 p-4 sm:p-5">{filteredDocuments.length ? filteredDocuments.map((item) => <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-slate-50/40 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"><CalendarDays className="h-3.5 w-3.5"/>Diperbarui: {formatMonth(item.revision_month)}</span><h3 className="mt-2 break-words text-sm font-bold leading-snug text-slate-900">{item.title}</h3>{item.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.description}</p>}<a href={item.attachment?.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"><FileText className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{item.attachment?.name || 'Buka berkas PDF'}</span></a></div><div className="flex shrink-0 items-center gap-2"><a href={item.attachment?.url} target="_blank" rel="noreferrer" aria-label={`Unduh ${item.title}`} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"><Download className="h-3.5 w-3.5"/><span>Unduh</span></a><button type="button" onClick={() => setEditingId(item.id)} aria-label={`Edit ${item.title}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-white hover:text-blue-700"><Pencil className="h-4 w-4"/></button><button type="button" onClick={() => deleteDocument(item.id)} disabled={busy} aria-label={`Hapus ${item.title}`} className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button></div></article>) : <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-700">{search ? 'Dokumen tidak ditemukan' : 'Belum ada dokumen'}</p><p className="mt-1 text-xs text-slate-500">{search ? 'Coba kata kunci lain.' : 'Dokumen yang ditambahkan akan muncul pada daftar dan arsip publik.'}</p></div>}</div>
      </section>
    </div>
  </div>
}
