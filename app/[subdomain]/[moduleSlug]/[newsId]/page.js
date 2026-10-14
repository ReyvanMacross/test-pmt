import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock3, FileText, MapPin, Newspaper, UserRound } from 'lucide-react'
import { getKecamatanPortal, plainContent } from '@/lib/public-kecamatan'
import { PortalFooter, PortalHeader } from '../../PortalChrome'

export const dynamic = 'force-dynamic'

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value)) : 'Tanggal belum tersedia'
}

export async function generateMetadata({ params }) {
  const { subdomain, moduleSlug, newsId } = await params
  if (moduleSlug !== 'berita') return { title: 'Halaman tidak ditemukan' }
  const portal = await getKecamatanPortal(subdomain)
  const article = portal?.news.find((item) => String(item.id) === String(newsId) && item.body)
  return article ? { title: `${article.title} — ${portal.website.name}`, description: article.excerpt || article.title, openGraph: { title: article.title, description: article.excerpt || article.title, images: article.image ? [article.image] : [] } } : { title: 'Berita tidak ditemukan' }
}

export default async function PublicNewsArticlePage({ params }) {
  const { subdomain, moduleSlug, newsId } = await params
  if (moduleSlug !== 'berita') notFound()
  const portal = await getKecamatanPortal(subdomain)
  if (!portal || portal.moduleVisibility?.berita === false) notFound()
  const article = portal.news.find((item) => String(item.id) === String(newsId) && item.body)
  if (!article) notFound()
  const related = portal.news.filter((item) => String(item.id) !== String(article.id)).slice(0, 3)
  const upcomingAgendas = portal.agendas.filter((item) => new Date(item.start_date) >= new Date(new Date().toDateString())).slice(0, 3)
  const paragraphs = String(article.body).split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean)

  return <div className="public-portal min-h-screen bg-slate-50 text-slate-900">
    <PortalHeader website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/>
    <header className="relative overflow-hidden border-b border-white/10 bg-[#06141D] px-5 py-10 text-white sm:py-14 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.4),transparent_65%)]"/>
      <div className="relative mx-auto w-full max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-300"><Link href={`/${subdomain}`} className="hover:text-teal-200">Beranda</Link><span>/</span><Link href={`/${subdomain}/berita`} className="hover:text-teal-200">Kabar Berita</Link><span>/</span><span className="max-w-[45vw] truncate text-white">Detail Berita</span></nav>
        <span className="inline-flex rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-200">{article.category || 'Kabar Wilayah'}</span>
        <h1 className="mt-4 max-w-4xl text-2xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">{article.title}</h1>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-300"><span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-teal-300"/>{article.author || `Redaksi ${portal.website.name}`}</span><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-teal-300"/>{formatDate(article.published_at || article.created_at)}</span></div>
      </div>
    </header>
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-12">
      <article className="min-w-0 space-y-7 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8 lg:col-span-8">
        {article.image && <figure className="overflow-hidden rounded-2xl bg-slate-100"><img src={article.image} alt={article.title} className="max-h-[480px] w-full object-cover" referrerPolicy="no-referrer"/><figcaption className="px-4 py-3 text-xs text-slate-500">Dokumentasi: {article.title}</figcaption></figure>}
        {article.excerpt && <div className="rounded-2xl border-l-4 border-teal-600 bg-teal-50/70 p-5 text-sm font-semibold leading-7 text-slate-800 sm:text-base">{article.excerpt}</div>}
        <div className="space-y-5 text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">{paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}</div>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between"><Link href={`/${subdomain}/berita`} className="inline-flex items-center gap-2 font-bold text-teal-700"><ArrowLeft className="h-4 w-4"/>Kembali ke kabar berita</Link>{article.url && <a href={article.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-teal-700">Sumber resmi: {article.source_domain || 'Buka sumber'}<ArrowUpRight className="h-4 w-4"/></a>}</div>
      </article>
      <aside className="space-y-5 lg:col-span-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Newspaper className="h-5 w-5 text-teal-700"/><h2 className="font-extrabold">Berita Terkait</h2></div>{related.length ? <ul className="mt-4 divide-y divide-slate-100">{related.map((item) => <li key={item.id} className="py-4 first:pt-0 last:pb-0"><Link href={item.body ? `/${subdomain}/berita/${item.id}` : item.url || `/${subdomain}/berita`} target={!item.body && item.url ? '_blank' : undefined} rel={!item.body && item.url ? 'noreferrer' : undefined} className="group"><span className="text-[10px] font-semibold text-teal-700">{formatDate(item.published_at || item.created_at)}</span><span className="mt-1 block text-sm font-bold leading-5 text-slate-800 group-hover:text-teal-700">{item.title}</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-700">Baca berita<ArrowUpRight className="h-3.5 w-3.5"/></span></Link></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Belum ada berita terkait.</p>}</section>
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Newspaper className="h-4 w-4"/></span><h2 className="text-base font-extrabold">Pengumuman Penting</h2></div><span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">{portal.announcements.length} Aktif</span></div>{portal.announcements.length ? <div className="space-y-3">{portal.announcements.slice(0, 3).map((item) => <article key={item.id} className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 transition hover:border-teal-500/40"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-teal-700"><span className="rounded border border-teal-500/20 bg-teal-50 px-2 py-0.5">Terbit {formatDate(item.publish_date)}</span>{item.expires_at && <span className="text-slate-500">Berlaku s.d. {formatDate(item.expires_at)}</span>}</div><h3 className="text-sm font-bold leading-snug text-slate-900">{item.title}</h3>{item.body && <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{plainContent(item.body)}</p>}{item.attachment_path && <a href={item.attachment_path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700"><FileText className="h-3.5 w-3.5"/>{item.attachment_name || 'Lihat lampiran'}</a>}</article>)}</div> : <p className="text-sm text-slate-500">Belum ada pengumuman aktif.</p>}<Link href={`/${subdomain}/pengumuman`} className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">Semua pengumuman<ArrowRight className="h-3.5 w-3.5"/></Link></section>
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarDays className="h-4 w-4"/></span><h2 className="text-base font-extrabold">Agenda Kegiatan</h2></div><Link href={`/${subdomain}/agenda-kegiatan`} className="text-xs font-bold text-teal-700">Semua</Link></div>{upcomingAgendas.length ? <div className="space-y-3">{upcomingAgendas.map((item) => { const date = new Date(item.start_date); return <article key={item.id} className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 transition hover:bg-teal-50/30"><div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"><span className="text-sm font-extrabold leading-none">{new Intl.DateTimeFormat('id-ID',{day:'2-digit'}).format(date)}</span><span className="mt-1 text-[9px] font-semibold uppercase tracking-wider">{new Intl.DateTimeFormat('id-ID',{month:'short'}).format(date)}</span></div><div className="min-w-0 flex-1"><span className="block text-[9px] font-bold uppercase tracking-wider text-indigo-600">Mendatang</span><h3 className="mt-1 text-sm font-bold leading-snug text-slate-900">{item.title}</h3>{item.time_range && <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3 w-3 shrink-0"/>{item.time_range}</p>}{item.location && <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="h-3 w-3 shrink-0"/>{item.location}</p>}</div></article>})}</div> : <p className="text-sm text-slate-500">Belum ada agenda mendatang.</p>}</section>
      </aside>
    </main>
    <PortalFooter website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/>
  </div>
}
