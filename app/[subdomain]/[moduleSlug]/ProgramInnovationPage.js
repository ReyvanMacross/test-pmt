'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, FileText, Lightbulb, Search, Sparkles } from 'lucide-react'
import { sanitizeRichHtml } from '@/lib/rich-text'

function Paragraphs({ value }) {
  const html = sanitizeRichHtml(value || '')
  if (!html) return <p className="text-sm text-slate-500">Informasi program belum tersedia.</p>
  return <div className="rich-content text-sm leading-7 text-slate-600" dangerouslySetInnerHTML={{ __html: html }}/>
}

function ProgramFiles({ files = [] }) {
  if (!files.length) return null
  return <div className="mt-6 grid gap-3 sm:grid-cols-2">{files.map((file, index) => <a key={`${file.url || file.path}-${index}`} href={file.url || file.path} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-teal-800 transition hover:border-teal-300 hover:bg-teal-50"><FileText className="h-5 w-5 shrink-0"/><span className="min-w-0 flex-1 truncate">{file.name || `Berkas program ${index + 1}`}</span><ArrowUpRight className="h-4 w-4 shrink-0"/></a>)}</div>
}

function InnovationCard({ item }) {
  return <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
    <div className="relative h-44 bg-gradient-to-br from-[#0B2538] to-teal-800">
      {item.cover_path ? <img src={item.cover_path} alt={item.cover_name || `Cover ${item.title}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy"/> : <div className="flex h-full items-center justify-center text-teal-100"><Lightbulb className="h-12 w-12 opacity-80"/></div>}
      {item.launch_year && <span className="absolute right-3 top-3 rounded-lg border border-teal-300/30 bg-[#06141D]/90 px-2.5 py-1 text-[10px] font-extrabold text-teal-200">Tahun {item.launch_year}</span>}
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <h3 className="text-base font-extrabold leading-snug text-slate-900 transition group-hover:text-teal-700">{item.title}</h3>
      {item.description && <p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-relaxed text-slate-500 sm:text-sm">{item.description}</p>}
      {(item.application_url || item.video_url) && <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">
        {item.application_url && <a href={item.application_url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2.5 text-xs font-bold text-teal-800 transition hover:bg-teal-100"><span className="truncate">Aplikasi / Website</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0"/></a>}
        {item.video_url && <a href={item.video_url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"><span className="truncate">Profil Video</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0"/></a>}
      </div>}
    </div>
  </article>
}

export default function ProgramInnovationPage({ website, content, innovations = [], showProgram = true, showInnovations = true }) {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase('id-ID')
  const visibleInnovations = useMemo(() => innovations.filter((item) => !normalizedSearch || `${item.title} ${item.description || ''} ${item.launch_year || ''}`.toLocaleLowerCase('id-ID').includes(normalizedSearch)), [innovations, normalizedSearch])
  const files = [...(Array.isArray(content?.files) ? content.files : []), ...(Array.isArray(content?.images) ? content.images : [])]

  return <>
    <main className="mx-auto w-full max-w-[1240px] space-y-10 px-4 py-9 sm:space-y-12 sm:px-6 sm:py-12">
      {showProgram && <section aria-labelledby="program-title" className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
        <div className="border-b border-slate-100 pb-4"><span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-700">Rencana Kerja Wilayah</span><h2 id="program-title" className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{content?.title || `Program dan Kegiatan ${website.name}`}</h2></div>
        <Paragraphs value={content?.body}/>
        <ProgramFiles files={files}/>
        {!content?.body?.trim() && !files.length && <Link href={`/${website.subdomain}`} className="inline-flex text-xs font-bold text-teal-700 hover:underline">Kembali ke arsip modul</Link>}
      </section>}

      {showInnovations && <section aria-labelledby="innovation-title" className="space-y-5">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2"><span aria-hidden="true" className="h-6 w-2.5 rounded-full bg-teal-600"/><h2 id="innovation-title" className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Katalog Inovasi Pelayanan Publik</h2></div><p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">Produk, aplikasi, dan pembaruan pelayanan yang dikelola oleh {website.name}.</p></div>
          <label className="relative block w-full sm:max-w-xs"><span className="sr-only">Cari inovasi</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari inovasi..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"/></label>
        </div>
        {visibleInnovations.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleInnovations.map((item) => <InnovationCard key={item.id} item={item}/>)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><Sparkles className="mx-auto h-8 w-8 text-teal-600"/><h3 className="mt-3 font-bold text-slate-800">{search ? 'Inovasi tidak ditemukan' : 'Belum ada inovasi'}</h3><p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-500">{search ? 'Coba kata kunci yang berbeda.' : 'Inovasi yang dipublikasikan melalui Kelola Konten akan tampil di sini.'}</p></div>}
      </section>}
    </main>
  </>
}
