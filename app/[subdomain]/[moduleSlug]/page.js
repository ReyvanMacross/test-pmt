import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, FileText, MapPin, Play } from 'lucide-react'
import { contentIsFilled, plainContent, getKecamatanPortal, getKecamatanWebsite } from '@/lib/public-kecamatan'
import { CONTENT_MODULES } from '@/lib/content-modules'
import { PortalFooter, PortalHeader } from '../PortalChrome'

export const dynamic = 'force-dynamic'

function Panel({ children, className = '' }) { return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 ${className}`}>{children}</section> }
function GoogleMap({ url, title }) {
  if (!url) return null
  let embedUrl
  try {
    const parsed = new URL(url)
    const isGoogleMapsEmbed = ['www.google.com', 'google.com', 'maps.google.com'].includes(parsed.hostname) && parsed.pathname.startsWith('/maps/embed')
    if (!isGoogleMapsEmbed) return null
    embedUrl = parsed.toString()
  } catch { return null }
  return <div className="mt-5 overflow-hidden rounded-xl border border-slate-200"><iframe src={embedUrl} title={title} width="100%" height="360" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="block w-full"/></div>
}
function FileLinks({ files = [], images = [] }) {
  const entries = [...(Array.isArray(files) ? files : []), ...(Array.isArray(images) ? images : [])]
  if (!entries.length) return null
  return <div className="mt-6 grid gap-3 sm:grid-cols-2">{entries.map((file, index) => <a key={`${file.url || file.path}-${index}`} href={file.url || file.path} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-50"><FileText className="h-5 w-5 shrink-0"/><span className="min-w-0 flex-1 truncate">{file.name || `Berkas ${index + 1}`}</span><ArrowUpRight className="h-4 w-4 shrink-0"/></a>)}</div>
}
function ContentPanel({ module, content }) {
  if (!contentIsFilled(content)) return null
  const body = plainContent(content.body)
  return <Panel><h2 className="text-lg font-extrabold">{content.title || module.title}</h2>{body && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{body}</p>}<FileLinks files={content.files} images={content.images}/></Panel>
}
function ServiceList({ services }) {
  return services.length ? <div className="grid gap-4 md:grid-cols-2">{services.map((service) => <Panel key={service.id}><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-extrabold">{service.name}</h2>{service.category && <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">{service.category}</span>}</div>{service.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(service.description)}</p>}{service.requirements && <div className="mt-4"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Persyaratan</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(service.requirements)}</p></div>}{service.procedure && <div className="mt-4"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Prosedur</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(service.procedure)}</p></div>}<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">{service.completion_time && <span><Clock3 className="mr-1 inline h-3.5 w-3.5"/>{service.completion_time}</span>}{service.fee && <span>Tarif: {service.fee}</span>}{service.application_url && <a href={service.application_url} target="_blank" rel="noreferrer" className="font-bold text-teal-700">Akses layanan <ArrowUpRight className="inline h-3.5 w-3.5"/></a>}</div></Panel>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada layanan yang dipublikasikan.</p></Panel>
}
function ProfileBoundaries({ profile }) {
  const entries = [['Utara', profile.batas_utara], ['Selatan', profile.batas_selatan], ['Timur', profile.batas_timur], ['Barat', profile.batas_barat]].filter(([, value]) => value)
  if (!entries.length) return null
  return <div className="mt-5 border-t border-slate-100 pt-4"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Batas Wilayah</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2">{entries.map(([direction, value]) => <div key={direction} className="rounded-xl bg-slate-50 p-3"><dt className="text-[10px] font-bold uppercase text-slate-400">Sebelah {direction}</dt><dd className="mt-1 text-sm text-slate-700">{value}</dd></div>)}</dl></div>
}
function ModuleRecords({ slug, portal }) {
  if (slug === 'layanan') return <ServiceList services={portal.services}/>
  if (slug === 'berita') return portal.news.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{portal.news.map((news) => <a key={news.id} href={news.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{news.image && <img src={news.image} alt="" className="h-44 w-full object-cover" loading="lazy" referrerPolicy="no-referrer"/>}<div className="p-5"><p className="text-[10px] text-slate-400">{news.source_domain}</p><h2 className="mt-2 font-extrabold">{news.title}</h2>{news.excerpt && <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-500">{news.excerpt}</p>}<span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-700">Baca berita <ArrowUpRight className="h-3.5 w-3.5"/></span></div></a>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada berita yang dipublikasikan.</p></Panel>
  if (slug === 'agenda-kegiatan') return portal.agendas.length ? <div className="space-y-3">{portal.agendas.map((agenda) => <Panel key={agenda.id}><div className="flex gap-4"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"/><div><h2 className="font-extrabold">{agenda.title}</h2><p className="mt-1 text-xs font-semibold text-teal-700">{new Date(agenda.start_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}{agenda.end_date && ` – ${new Date(agenda.end_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}`}</p>{agenda.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(agenda.description)}</p>}<div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">{agenda.time_range && <span><Clock3 className="mr-1 inline h-3.5 w-3.5"/>{agenda.time_range}</span>}{agenda.location && <span><MapPin className="mr-1 inline h-3.5 w-3.5"/>{agenda.location}</span>}{agenda.organizer && <span>Penyelenggara: {agenda.organizer}</span>}</div></div></div></Panel>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada agenda yang dipublikasikan.</p></Panel>
  if (slug === 'pengumuman') return portal.announcements.length ? <div className="space-y-4">{portal.announcements.map((item) => <Panel key={item.id}><p className="text-xs font-semibold text-teal-700">Terbit {new Date(item.publish_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</p><h2 className="mt-2 font-extrabold">{item.title}</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(item.body)}</p>{item.attachment_path && <a href={item.attachment_path} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700"><FileText className="h-4 w-4"/>{item.attachment_name || 'Unduh lampiran'}<ArrowUpRight className="h-4 w-4"/></a>}</Panel>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada pengumuman aktif.</p></Panel>
  if (slug === 'inovasi') return portal.innovations.length ? <div className="grid gap-4 md:grid-cols-2">{portal.innovations.map((item) => <Panel key={item.id}>{item.cover_path && <img src={item.cover_path} alt="" className="mb-4 max-h-72 w-full rounded-xl object-cover" loading="lazy"/>}<h2 className="font-extrabold">{item.title}</h2>{item.launch_year && <p className="mt-1 text-xs font-bold text-teal-700">Tahun {item.launch_year}</p>}<p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(item.description)}</p><div className="mt-4 flex flex-wrap gap-3">{item.application_url && <a href={item.application_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">Buka aplikasi <ArrowUpRight className="inline h-3.5 w-3.5"/></a>}{item.video_url && <a href={item.video_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">Lihat video <ArrowUpRight className="inline h-3.5 w-3.5"/></a>}</div></Panel>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada inovasi yang dipublikasikan.</p></Panel>
  if (slug === 'galeri-gambar' || slug === 'galeri-video') {
    const type = slug === 'galeri-gambar' ? 'image' : 'video'
    const albums = portal.albums.filter((album) => album.type === type)
    return albums.length ? <div className="space-y-8">{albums.map((album) => <Panel key={album.id}><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-extrabold">{album.title}</h2><p className="mt-1 text-xs text-slate-500">{new Date(album.album_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} · {album.item_count} item</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{album.items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200">{type === 'image' ? <img src={item.path} alt={item.name || ''} className="aspect-[4/3] w-full object-cover" loading="lazy"/> : (item.path?.startsWith('http') && !item.path.includes('/storage/v1/object/public/')) ? <a href={item.path} target="_blank" rel="noreferrer" className="flex aspect-video items-center justify-center gap-2 bg-slate-900 text-sm font-bold text-white"><Play className="h-5 w-5"/>Buka video eksternal</a> : <video src={item.path} controls preload="metadata" className="aspect-video w-full bg-slate-950"/>}<div className="p-3"><h3 className="text-xs font-bold">{item.name}</h3>{item.description && <p className="mt-1 text-xs text-slate-500">{plainContent(item.description)}</p>}</div></article>)}</div></Panel>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada album untuk modul ini.</p></Panel>
  }
  if (slug === 'kontak') {
    const profile = portal.profile
    const values = [['Alamat Kantor', profile?.contact_address], ['Jam Operasional', profile?.operating_hours], ['Telepon', profile?.office_phone], ['WhatsApp', profile?.whatsapp_phone], ['Email Resmi', profile?.official_email], ['Instagram', profile?.instagram_username], ['Facebook', profile?.facebook_page_name]]
    const populated = values.filter(([, value]) => value)
    return populated.length || profile?.google_maps_url || profile?.youtube_channel_url ? <Panel><div className="grid gap-5 sm:grid-cols-2">{populated.map(([label, value]) => <div key={label}><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-800">{value}</p></div>)}</div>{profile.google_maps_url && <GoogleMap url={profile.google_maps_url} title={`Peta lokasi ${portal.website.name}`}/> }{(profile.google_maps_url || profile.youtube_channel_url) && <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">{profile.google_maps_url && <a href={profile.google_maps_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-teal-700">Buka lokasi peta <ArrowUpRight className="inline h-4 w-4"/></a>}{profile.youtube_channel_url && <a href={profile.youtube_channel_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-teal-700">Kanal YouTube <ArrowUpRight className="inline h-4 w-4"/></a>}</div>}</Panel> : <Panel><p className="text-sm text-slate-500">Informasi kontak belum tersedia.</p></Panel>
  }
  if (slug === 'profil') return portal.profile ? <div className="space-y-4"><Panel><h2 className="font-extrabold">Data Wilayah {portal.website.name}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Luas Wilayah',portal.profile.luas_wilayah,'km²'],['Jumlah RW',portal.profile.jumlah_rw,'RW'],['Jumlah RT',portal.profile.jumlah_rt,'RT'],['Jumlah KK',portal.profile.jumlah_kk,'KK'],['Total Penduduk',portal.profile.total_jiwa,'Jiwa'],['Kepuasan Warga',portal.profile.kepuasan_warga,'%']].filter(([,value])=>value).map(([label,value,unit])=><div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-extrabold text-teal-700">{value} {unit}</p></div>)}</div>{portal.profile.visi && <div className="mt-5"><h3 className="text-xs font-bold uppercase text-slate-500">Visi</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(portal.profile.visi)}</p></div>}{portal.profile.misi && <div className="mt-4"><h3 className="text-xs font-bold uppercase text-slate-500">Misi</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(portal.profile.misi)}</p></div>}<ProfileBoundaries profile={portal.profile}/></Panel>{portal.profile.maps_embed_url && <Panel><h2 className="font-extrabold">Peta Wilayah</h2><GoogleMap url={portal.profile.maps_embed_url} title={`Peta wilayah ${portal.website.name}`}/></Panel>}</div> : <Panel><p className="text-sm text-slate-500">Data profil wilayah belum tersedia.</p></Panel>

  return null
}

export async function generateMetadata({ params }) {
  const { subdomain, moduleSlug } = await params
  try {
    const website = await getKecamatanWebsite(subdomain)
    const portalModule = CONTENT_MODULES.find((entry) => entry.slug === moduleSlug)
    return website && portalModule ? { title: `${portalModule.title} — ${website.name}` } : { title: 'Modul portal' }
  } catch { return { title: 'Modul portal — Pemerintah Kota Bandung' } }
}

export default async function PublicModulePage({ params }) {
  const { subdomain, moduleSlug } = await params
  const portal = await getKecamatanPortal(subdomain)
  if (!portal) notFound()
  const portalModule = portal.modules.find((entry) => entry.slug === moduleSlug)
  if (!portalModule) notFound()
  const recordModules = ['layanan','berita','agenda-kegiatan','pengumuman','inovasi','galeri-gambar','galeri-video','kontak','profil']
  const genericContent = portal.contents[moduleSlug]
  return <div className="public-portal min-h-screen bg-slate-50 text-slate-900"><PortalHeader website={portal.website} profile={portal.profile}/><main className="mx-auto w-full max-w-[1440px] space-y-7 px-5 py-8 sm:py-12 lg:px-10"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Link href={`/${subdomain}`} className="inline-flex items-center gap-2 text-xs font-bold text-teal-700"><ArrowLeft className="h-4 w-4"/>Kembali ke beranda</Link><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-700">{portal.website.name} · Arsip & Modul</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{portalModule.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">{portalModule.description}</p></div><ModuleRecords slug={moduleSlug} portal={portal}/>{contentIsFilled(genericContent) && <ContentPanel module={portalModule} content={genericContent}/>}{!recordModules.includes(moduleSlug) && !contentIsFilled(genericContent) && <Panel><p className="text-sm text-slate-500">Belum ada konten yang dipublikasikan untuk modul ini.</p></Panel>}</main><PortalFooter website={portal.website} profile={portal.profile}/></div>
}
