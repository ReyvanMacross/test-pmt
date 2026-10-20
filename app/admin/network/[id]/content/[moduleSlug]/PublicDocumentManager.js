'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Check, Download, ExternalLink, FileText, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { deletePublicDocumentItemAction, savePublicDocumentItemAction } from '../actions'
import { getPublicDocumentsForAdmin } from '@/lib/public-documents'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15'
const documentModules = new Set(['ppid','ppid-utama','daftar-informasi-publik','daftar-informasi-dikecualikan','informasi-wajib-berkala','informasi-tersedia-setiap-saat','informasi-serta-merta'])

function formatMonth(value) {
  if (!value) return 'Tanggal pembaruan belum diisi'
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

export default function PublicDocumentManager({ website, moduleMeta, initialContent }) {
  const router = useRouter()
  const [documents, setDocuments] = useState(() => Array.isArray(initialContent.documents) ? initialContent.documents : getPublicDocumentsForAdmin(initialContent))
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [busy, startTransition] = useTransition()
  const [notice, setNotice] = useState(null)
  const editingDocument = documents.find((item) => item.id === editingId)
  const filteredDocuments = useMemo(() => documents.filter((item) => `${item.title} ${item.description || ''}`.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID'))), [documents, search])

  function notify(type, message) {
    setNotice({ type, message })
    window.setTimeout(() => setNotice(null), 5000)
  }

  async function saveDocument(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (editingId) data.set('document_id', editingId)
    startTransition(async () => {
      try {
        const result = await savePublicDocumentItemAction(website.id, moduleMeta.slug, data)
        if (result.error) { notify('error', result.error || 'Dokumen gagal disimpan.'); return }
        setDocuments((current) => editingId ? current.map((item) => item.id === editingId ? result.document : item) : [result.document, ...current])
        setEditingId(null)
        form.reset()
        notify('success', result.message || 'Dokumen berhasil disimpan.')
        router.refresh()
      } catch (error) {
        notify('error', error.message || 'Gagal menyimpan dokumen. Periksa ukuran berkas dan coba kembali.')
      }
    })
  }

  function deleteDocument(id) {
    if (!window.confirm('Hapus dokumen ini dari daftar publikasi?')) return
    startTransition(async () => {
      try {
        const result = await deletePublicDocumentItemAction(website.id, moduleMeta.slug, id)
        if (result.error) { notify('error', result.error || 'Dokumen gagal dihapus.'); return }
        setDocuments((current) => current.filter((item) => item.id !== id))
        if (editingId === id) setEditingId(null)
        notify('success', 'Dokumen berhasil dihapus.')
        router.refresh()
      } catch (error) {
        notify('error', error.message || 'Gagal menghapus dokumen. Silakan coba kembali.')
      }
    })
  }

  function resetDocumentForm() {
    setEditingId(null)
    document.getElementById('public-document-form')?.reset()
  }

  return <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-9">
    {notice && <div role="status" className={`fixed right-4 top-20 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><span className="mt-0.5">{notice.type === 'error' ? <X className="h-4 w-4"/> : <Check className="h-4 w-4"/>}</span>{notice.message}</div>}

    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
      <div className="min-w-0"><h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Kelola {moduleMeta.title}</h1><p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500"><span>{website.name} —</span><a href={`/${website.subdomain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">/{website.subdomain}<ExternalLink className="h-3 w-3"/></a></p></div>
      <a href={`/admin/network/${website.id}/content`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5"/>Kembali</a>
    </section>

    <div className="space-y-5">
      <form id="public-document-form" onSubmit={saveDocument} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">{editingDocument ? `Edit ${moduleMeta.title}` : `Tambah ${moduleMeta.title} Baru`}</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Unggah berkas naskah atau ringkasan dokumen {moduleMeta.title} resmi perangkat daerah.</p></div>
        <input type="hidden" name="document_id" value={editingId || ''}/>
        <div><label htmlFor="document-title" className="mb-2 block text-xs font-semibold text-slate-700">Judul Dokumen <span className="text-rose-500">*</span></label><input id="document-title" name="document_title" required maxLength={255} defaultValue={editingDocument?.title || ''} key={`title-${editingId || 'new'}`} className={`${inputClass} py-2.5 text-xs`} placeholder={`Contoh: ${moduleMeta.title} Kecamatan ${website.name}`}/></div>
        <div><label htmlFor="document-description" className="mb-2 block text-xs font-semibold text-slate-700">Deskripsi Ringkas Dokumen</label><textarea id="document-description" name="document_description" rows={3} maxLength={4000} defaultValue={editingDocument?.description || ''} key={`description-${editingId || 'new'}`} className={`${inputClass} resize-y py-2.5 text-xs leading-5`} placeholder="Tuliskan ringkasan pokok mengenai dokumen yang diunggah..."/></div>
        <div className="grid gap-4 md:grid-cols-2"><div><label htmlFor="revision-month" className="mb-2 block text-xs font-semibold text-slate-700">Tanggal / Bulan Diperbarui <span className="text-rose-500">*</span></label><input id="revision-month" name="revision_month" type="month" required defaultValue={editingDocument?.revision_month || ''} key={`month-${editingId || 'new'}`} className={`${inputClass} py-2.5 text-xs`}/></div>
          <div><label htmlFor="document-file" className="mb-2 block text-xs font-semibold text-slate-700">Unggah Berkas Dokumen (PDF) <span className="text-rose-500">*</span></label><input id="document-file" name="document_file" type="file" accept="application/pdf,.pdf" required={!editingDocument} className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100" key={`file-${editingId || 'new'}`}/><p className="mt-1 text-[10px] text-slate-400">Format PDF saja, kapasitas maksimal 10 MB{editingDocument ? ' · Berkas lama dipakai jika tidak diganti' : ''}</p></div></div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">{editingDocument && <button type="button" onClick={resetDocumentForm} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><X className="h-3.5 w-3.5"/>Batal</button>}<button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Plus className="h-3.5 w-3.5"/>{busy ? 'Menyimpan...' : editingDocument ? 'Simpan Perubahan' : 'Tambah Dokumen'}</button></div>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">Daftar Dokumen Dipublikasikan <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{documents.length}</span></h2><p className="mt-1 text-xs text-slate-500">Daftar informasi publik yang dapat diakses dan diunduh masyarakat umum.</p></div><label className="relative block w-full sm:max-w-56"><span className="sr-only">Cari dokumen</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} py-2 pl-9 text-xs`} placeholder="Cari dokumen..."/></label></div>
        <div className="space-y-3 p-4 sm:p-5">{filteredDocuments.length ? filteredDocuments.map((item) => <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-slate-50/40 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"><CalendarDays className="h-3.5 w-3.5"/>Diperbarui: {formatMonth(item.revision_month)}</span><h3 className="mt-2 break-words text-sm font-bold leading-snug text-slate-900">{item.title}</h3>{item.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.description}</p>}<a href={item.attachment?.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"><FileText className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{item.attachment?.name || 'Buka berkas PDF'}</span></a></div><div className="flex shrink-0 items-center gap-2"><a href={item.attachment?.url} target="_blank" rel="noreferrer" aria-label={`Unduh ${item.title}`} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"><Download className="h-3.5 w-3.5"/><span>Unduh</span></a><button type="button" onClick={() => setEditingId(item.id)} aria-label={`Edit ${item.title}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-white hover:text-blue-700"><Pencil className="h-4 w-4"/></button><button type="button" onClick={() => deleteDocument(item.id)} disabled={busy} aria-label={`Hapus ${item.title}`} className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button></div></article>) : <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-700">{search ? 'Dokumen tidak ditemukan' : 'Belum ada dokumen'}</p><p className="mt-1 text-xs text-slate-500">{search ? 'Coba kata kunci lain.' : 'Dokumen yang ditambahkan akan muncul pada daftar dan arsip publik.'}</p></div>}</div>
      </section>
    </div>
  </div>
}
