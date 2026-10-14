'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Search, Newspaper, MapPin, Clock3, FileText } from 'lucide-react'

function dateLabel(value) {
  if (!value) return 'Tanggal belum tersedia'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

function NewsCard({ item, subdomain, featured = false }) {
  const href = item.body ? `/${subdomain}/berita/${item.id}` : item.url
  const external = !item.body && item.url
  return <article className={`group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${featured ? 'grid lg:grid-cols-12' : 'flex flex-col'}`}>
    <Link href={href || `/${subdomain}/berita/${item.id}`} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className={featured ? 'relative block h-56 overflow-hidden bg-slate-900 sm:h-72 lg:col-span-7 lg:h-[320px]' : 'relative block h-48 overflow-hidden bg-slate-900'}>
      {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" referrerPolicy="no-referrer"/> : <div className="flex h-full min-h-48 items-center justify-center bg-gradient-to-br from-[#06141D] to-teal-900 text-teal-200"><Newspaper className="h-10 w-10"/></div>}
      <span className="absolute left-4 top-4 rounded-full bg-[#06141D]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-200">{item.category || 'Kabar Wilayah'}</span>
    </Link>
    <div className={`flex flex-col justify-between gap-5 p-5 sm:p-7 ${featured ? 'lg:col-span-5' : 'flex-1'}`}>
      <div><p className="flex items-center gap-2 text-xs font-medium text-slate-500"><CalendarDays className="h-3.5 w-3.5 text-teal-700"/>{dateLabel(item.published_at || item.created_at)}{item.author && <>· {item.author}</>}</p><Link href={href || `/${subdomain}/berita/${item.id}`} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}><h2 className={`${featured ? 'mt-3 text-xl sm:text-2xl' : 'mt-3 text-base'} font-extrabold leading-snug text-slate-900 transition group-hover:text-teal-700`}>{item.title}</h2></Link>{item.excerpt && <p className={`mt-3 text-sm leading-6 text-slate-600 ${featured ? '' : 'line-clamp-3'}`}>{item.excerpt}</p>}</div>
      <Link href={href || `/${subdomain}/berita/${item.id}`} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="inline-flex items-center gap-2 text-sm font-bold text-teal-700">Baca selengkapnya<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></Link>
    </div>
  </article>
}

export default function NewsArchive({ portal }) {
  const { news, website, announcements, agendas, albums } = portal
  const [search, setSearch] = useState('')
  const featured = news[0]
  const upcomingAgendas = agendas.filter((item) => new Date(item.start_date) >= new Date(new Date().toDateString())).slice(0, 3)
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('id')
    const remaining = featured ? news.slice(1) : news
    return term ? remaining.filter((item) => [item.title, item.excerpt, item.category, item.author].some((value) => value?.toLocaleLowerCase('id').includes(term))) : remaining
  }, [news, featured, search])

  return <div className="space-y-10">
    <section className="space-y-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-700"><Newspaper className="h-4 w-4"/>Publikasi pilihan</div>{featured ? <NewsCard item={featured} subdomain={website.subdomain} featured/> : <div className="rounded-3xl bg-gradient-to-br from-[#06141D] to-teal-900 px-6 py-14 text-center text-white"><Newspaper className="mx-auto h-10 w-10 text-teal-300"/><h2 className="mt-4 text-xl font-extrabold">Kabar dan informasi wilayah</h2><p className="mt-2 text-sm text-slate-200">Berita terbaru akan ditampilkan di halaman ini.</p></div>}</section>
    <div className="grid gap-8 lg:grid-cols-12">
      <section className="space-y-5 lg:col-span-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Pembaruan wilayah</span><h2 className="mt-1 text-xl font-extrabold">Kabar Terkini Wilayah</h2></div><label className="relative block w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari berita..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"/></label></div>{filtered.length ? <div className="grid gap-4 sm:grid-cols-2">{filtered.map((item) => <NewsCard key={item.id} item={item} subdomain={website.subdomain}/>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{search ? 'Tidak ada berita yang cocok dengan pencarian.' : 'Belum ada berita lainnya.'}</div>}</section>
      <aside className="space-y-5 lg:col-span-4">
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Newspaper className="h-4 w-4"/></span><h2 className="text-base font-extrabold">Pengumuman Penting</h2></div><span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">{announcements.length} Aktif</span></div>{announcements.length ? <div className="space-y-3">{announcements.slice(0, 3).map((item) => <article key={item.id} className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 transition hover:border-teal-500/40"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-teal-700"><span className="rounded border border-teal-500/20 bg-teal-50 px-2 py-0.5">Terbit {dateLabel(item.publish_date)}</span>{item.expires_at && <span className="text-slate-500">Berlaku s.d. {dateLabel(item.expires_at)}</span>}</div><h3 className="text-sm font-bold leading-snug text-slate-900">{item.title}</h3>{item.body && <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{item.body}</p>}{item.attachment_path && <a href={item.attachment_path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700"><FileText className="h-3.5 w-3.5"/>{item.attachment_name || 'Lihat lampiran'}</a>}</article>)}</div> : <p className="text-sm text-slate-500">Belum ada pengumuman aktif.</p>}<Link href={`/${website.subdomain}/pengumuman`} className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">Semua pengumuman<ArrowRight className="h-3.5 w-3.5"/></Link></section>
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarDays className="h-4 w-4"/></span><h2 className="text-base font-extrabold">Agenda Kegiatan</h2></div><Link href={`/${website.subdomain}/agenda-kegiatan`} className="text-xs font-bold text-teal-700">Semua</Link></div>{upcomingAgendas.length ? <div className="space-y-3">{upcomingAgendas.map((item) => { const date = new Date(item.start_date); return <article key={item.id} className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 transition hover:bg-teal-50/30"><div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"><span className="text-sm font-extrabold leading-none">{new Intl.DateTimeFormat('id-ID',{day:'2-digit'}).format(date)}</span><span className="mt-1 text-[9px] font-semibold uppercase tracking-wider">{new Intl.DateTimeFormat('id-ID',{month:'short'}).format(date)}</span></div><div className="min-w-0 flex-1"><span className="block text-[9px] font-bold uppercase tracking-wider text-indigo-600">Mendatang</span><h3 className="mt-1 text-sm font-bold leading-snug text-slate-900">{item.title}</h3>{item.time_range && <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3 w-3 shrink-0"/>{item.time_range}</p>}{item.location && <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="h-3 w-3 shrink-0"/>{item.location}</p>}</div></article>})}</div> : <p className="text-sm text-slate-500">Belum ada agenda mendatang.</p>}</section>
        {albums.length > 0 && <Link href={`/${website.subdomain}/galeri-gambar`} className="block rounded-2xl bg-[#06141D] p-5 text-white"><p className="text-xs font-bold uppercase tracking-widest text-teal-300">Dokumentasi kegiatan</p><h2 className="mt-2 font-extrabold">Galeri Foto Wilayah</h2><p className="mt-1 text-xs text-slate-300">Lihat dokumentasi kegiatan terbaru.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-300">Jelajahi galeri<ArrowRight className="h-3.5 w-3.5"/></span></Link>}
      </aside>
    </div>
  </div>
}
