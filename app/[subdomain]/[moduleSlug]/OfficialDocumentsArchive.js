'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownToLine, ArrowUpRight, ExternalLink, FileText, Search } from 'lucide-react'
import { PUBLIC_DOCUMENT_CATEGORIES } from '@/lib/public-documents'

const categoryStyles = {
  dip: 'border-sky-200 bg-sky-50 text-sky-700',
  berkala: 'border-blue-200 bg-blue-50 text-blue-700',
  'setiap-saat': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'serta-merta': 'border-amber-200 bg-amber-50 text-amber-700',
  dikecualikan: 'border-rose-200 bg-rose-50 text-rose-700',
  ppid: 'border-violet-200 bg-violet-50 text-violet-700',
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric', timeZone: 'UTC' })

function formatUpdatedAt(value) {
  if (!value) return 'Tanggal pembaruan belum tersedia'
  const date = /^\d{4}-\d{2}$/.test(value) ? new Date(`${value}-01T00:00:00.000Z`) : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Tanggal pembaruan belum tersedia' : `Diperbarui: ${dateFormatter.format(date)}`
}

function fileLabel(file) {
  if (file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || file?.url || '')) return 'PDF'
  if (file?.type?.includes('word') || /\.docx?$/i.test(file?.name || file?.url || '')) return 'Dokumen'
  if (file?.type?.startsWith('image/')) return 'Gambar'
  return 'Berkas'
}

function formatFileSize(size) {
  if (!Number.isFinite(Number(size)) || Number(size) <= 0) return ''
  return `${(Number(size) / 1024 / 1024).toFixed(1)} MB`
}

function DocumentCard({ document, subdomain }) {
  const file = document.attachments?.[0]
  const fileUrl = file?.url || file?.path
  const detailHref = `/${subdomain}/${document.slug}`
  const external = document.externalUrl

  return <article className="flex min-w-0 flex-col justify-between gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-md border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${categoryStyles[document.category] || categoryStyles.ppid}`}>{document.categoryLabel}</span><span className="text-[9px] font-semibold uppercase text-slate-400">{file ? `${fileLabel(file)}${formatFileSize(file.size) ? ` | ${formatFileSize(file.size)}` : ''}` : external ? 'Portal Resmi' : 'Informasi'}</span></div>
      <h2 className="text-sm font-bold leading-snug text-slate-900 sm:text-base">{fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" className="hover:text-teal-700">{document.title}</a> : <Link href={detailHref} className="hover:text-teal-700">{document.title}</Link>}</h2>
      <p className="line-clamp-4 text-xs leading-relaxed text-slate-500">{document.description || document.moduleDescription}</p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
      <span className="text-[9px] text-slate-400">{formatUpdatedAt(document.updatedAt)}</span>
      {fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" download={file?.name || undefined} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-[10px] font-bold text-teal-700 transition hover:bg-teal-600 hover:text-white"><ArrowDownToLine className="h-3.5 w-3.5"/>Unduh</a> : external ? <a href={external} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-700 transition hover:bg-violet-600 hover:text-white">Kunjungi Portal <ExternalLink className="h-3.5 w-3.5"/></a> : <Link href={detailHref} className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 hover:text-teal-900">Lihat rincian <ArrowUpRight className="h-3.5 w-3.5"/></Link>}
    </div>
  </article>
}

export default function OfficialDocumentsArchive({ subdomain, documents, ppidIntroduction }) {
  const [activeCategory, setActiveCategory] = useState('semua')
  const [search, setSearch] = useState('')
  const visibleDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('id-ID')
    return documents.filter((document) => {
      const matchesCategory = activeCategory === 'semua' || document.category === activeCategory
      const matchesSearch = !normalizedSearch || `${document.title} ${document.description} ${document.moduleDescription} ${document.categoryLabel}`.toLocaleLowerCase('id-ID').includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, documents, search])

  return <>
    <main className="mx-auto w-full max-w-[1240px] space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      {ppidIntroduction && <section id="profil-ppid" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><FileText className="h-5 w-5"/></span><div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-widest text-teal-700">PPID Pelaksana</p><h2 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">{ppidIntroduction.title}</h2>{ppidIntroduction.description && <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-600 sm:text-sm">{ppidIntroduction.description}</p>}{ppidIntroduction.attachments?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{ppidIntroduction.attachments.map((file, index) => <a key={`${file.url || file.path}-${index}`} href={file.url || file.path} target="_blank" rel="noreferrer" download={file.name || undefined} className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"><ArrowDownToLine className="h-4 w-4"/>{file.name || 'Unduh dokumen PPID'}</a>)}</div>}</div></div></section>}

      <section aria-label="Filter dokumen resmi" className="space-y-4 border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kategori dokumen">{PUBLIC_DOCUMENT_CATEGORIES.map((category) => <button key={category.id} type="button" role="tab" aria-selected={activeCategory === category.id} onClick={() => setActiveCategory(category.id)} className={`rounded-xl border px-3 py-2 text-[10px] font-bold transition sm:px-4 sm:text-xs ${activeCategory === category.id ? 'border-teal-600 bg-teal-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>{category.label}</button>)}</div>
          <label className="relative block w-full sm:ml-auto sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><span className="sr-only">Cari dokumen</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama dokumen..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"/></label>
        </div>
        <p className="text-[11px] text-slate-500" aria-live="polite">Menampilkan {visibleDocuments.length} dari {documents.length} dokumen</p>
      </section>

      {visibleDocuments.length ? <section aria-label="Daftar dokumen" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleDocuments.map((document) => <DocumentCard key={document.key || document.slug} document={document} subdomain={subdomain}/>)}</section> : <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300"/><h2 className="mt-3 font-bold text-slate-800">Dokumen belum tersedia</h2><p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-500">{search ? 'Tidak ada dokumen yang sesuai dengan pencarian ini.' : 'Belum ada dokumen pada kategori ini. Informasi akan ditampilkan setelah diperbarui melalui Kelola Konten.'}</p></section>}
    </main>
  </>
}
