'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, Clock3, FileCheck2, ListChecks, Search, Sparkles } from 'lucide-react'
import PublicPageHero from '../PublicPageHero'

const categories = [
  ['all', 'Semua Layanan'],
  ['kependudukan', 'Kependudukan & Pencatatan Sipil'],
  ['perizinan', 'Perizinan & Non-Perizinan'],
  ['sosial', 'Kesejahteraan Sosial'],
  ['pemerintahan', 'Pemerintahan & Umum'],
]
const categoryNames = Object.fromEntries(categories.slice(1))

function ServiceDetails({ service }) {
  return <div className="mt-5 grid gap-4 lg:grid-cols-2">
    {service.requirements && <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><FileCheck2 className="h-4 w-4 text-teal-700"/>Persyaratan Dokumen</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{service.requirements}</p></section>}
    {service.procedure && <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><ListChecks className="h-4 w-4 text-teal-700"/>Prosedur &amp; Alur Pelayanan</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{service.procedure}</p></section>}
  </div>
}

function FeaturedService({ service }) {
  if (!service) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">Belum ada layanan yang dipublikasikan.</div>
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="bg-gradient-to-r from-[#06141D] to-teal-700 px-5 py-4 text-white sm:px-7"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-200">{categoryNames[service.category] || service.category || 'Kategori layanan'}</p><h2 className="mt-1 text-lg font-extrabold sm:text-xl">{service.name}</h2></div>
    <div className="space-y-5 p-5 sm:p-7"><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Deskripsi layanan</p><p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{service.description || 'Informasi layanan belum dilengkapi.'}</p></div><ServiceDetails service={service}/><div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">{service.completion_time ? <>Waktu penyelesaian: <strong className="text-slate-700">{service.completion_time}</strong></> : 'Informasi waktu penyelesaian belum tersedia.'}</p>{service.application_url && <a href={service.application_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800">Ajukan Permohonan Online <ArrowUpRight className="h-4 w-4"/></a>}</div></div>
  </article>
}

export default function ServiceCatalog({ website, services = [] }) {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const featured = services.find((service) => service.id === selectedId) || services[0] || null
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('id-ID')
    return services.filter((service) => category === 'all' || service.category === category)
      .filter((service) => !term || `${service.name} ${service.category} ${service.description}`.toLocaleLowerCase('id-ID').includes(term))
  }, [services, category, search])

  return <>
    <PublicPageHero eyebrow="Informasi Perizinan & Layanan Warga" title="Katalog Layanan Publik Terpadu" description={`Panduan persyaratan, prosedur pengajuan, estimasi waktu penyelesaian, dan kanal resmi pelayanan masyarakat di ${website.name}.`}>
      <form className="mx-auto mt-7 flex w-full max-w-2xl items-center gap-2 rounded-xl border border-white/20 bg-slate-950/50 p-2 text-left shadow-lg backdrop-blur-sm" onSubmit={(event) => event.preventDefault()} role="search"><Search className="ml-2 h-5 w-5 shrink-0 text-slate-300"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari layanan (contoh: e-KTP, KK, Surat Pindah)..." className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-300" aria-label="Cari layanan"/><button type="submit" className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-400">Cari</button></form>
    </PublicPageHero>
    <main className="mx-auto w-full max-w-[1440px] space-y-8 px-4 py-7 sm:px-6 sm:py-10 lg:px-10">
      <section aria-labelledby="all-services-heading" className="space-y-5"><div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Pilih kategori</p><h2 id="all-services-heading" className="mt-1 text-xl font-extrabold text-slate-900">Daftar Jenis Pelayanan</h2></div><div className="flex flex-wrap gap-2">{categories.map(([value, label]) => <button key={value} type="button" onClick={() => setCategory(value)} aria-pressed={category === value} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${category === value ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-800'}`}>{label}</button>)}</div></div>
        <section id="layanan-terpilih" aria-label="Detail layanan terpilih" className="scroll-mt-24 space-y-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700"><Sparkles className="h-4 w-4"/>{featured?.id === services[0]?.id ? 'Layanan Terbaru' : 'Detail Layanan Terpilih'}</div><FeaturedService key={featured?.id || 'empty'} service={featured}/></section>
        <div className="flex items-center justify-between gap-4 pt-2"><h3 className="text-base font-bold text-slate-900">Pilih Layanan untuk Melihat Detail</h3><p className="hidden text-xs text-slate-500 sm:block">Klik kartu untuk menampilkan informasi lengkap</p></div>
        {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((service) => <button key={service.id} type="button" onClick={() => { setSelectedId(service.id); document.getElementById('layanan-terpilih')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} aria-pressed={featured?.id === service.id} className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${featured?.id === service.id ? 'border-teal-400 ring-1 ring-teal-300' : 'border-slate-200 hover:border-teal-300'}`}><span className="flex items-start justify-between gap-3"><span className="font-extrabold leading-snug text-slate-900">{service.name}</span><span className="shrink-0 rounded-md bg-teal-50 px-2 py-1 text-[9px] font-bold uppercase text-teal-800">{service.application_url ? 'Online' : 'Informasi'}</span></span><span className="mt-2 block text-xs font-semibold text-teal-700">{categoryNames[service.category] || service.category}</span><span className="mt-3 line-clamp-4 block whitespace-pre-line text-sm leading-6 text-slate-600">{service.description}</span><span className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">{service.completion_time ? <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-teal-700"/>{service.completion_time}</span> : <span>Rincian layanan tersedia</span>}<span className="inline-flex shrink-0 items-center gap-1 font-bold text-teal-700">Lihat detail <ArrowUpRight className="h-3.5 w-3.5"/></span></span></button>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">Tidak ada layanan yang cocok dengan pencarian atau kategori ini.</div>}
      </section>
    </main>
  </>
}
