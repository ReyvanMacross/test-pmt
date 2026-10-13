import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, BadgeCheck, CalendarDays, Clock3, FileText, Flag, House, MapPin, Play, Ruler, UsersRound } from 'lucide-react'
import { contentIsFilled, plainContent, getKecamatanPortal, getKecamatanWebsite } from '@/lib/public-kecamatan'
import { CONTENT_MODULES } from '@/lib/content-modules'
import { PortalFooter, PortalHeader } from '../PortalChrome'
import OrganizationStructureViewer from './OrganizationStructureViewer'

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
  return <Panel><h2 className="text-lg font-extrabold">{content.title || module.title}</h2>{module.slug === 'profil-pimpinan' && content.metadata?.pangkat_golongan && <p className="mt-2 text-sm font-semibold text-teal-700">Pangkat / Golongan PNS: {content.metadata.pangkat_golongan}</p>}{body && <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{body}</p>}<FileLinks files={content.files} images={content.images}/></Panel>
}
function ServiceList({ services }) {
  return services.length ? <div className="grid gap-4 md:grid-cols-2">{services.map((service) => <Panel key={service.id}><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-extrabold">{service.name}</h2>{service.category && <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">{service.category}</span>}</div>{service.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(service.description)}</p>}{service.requirements && <div className="mt-4"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Persyaratan</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(service.requirements)}</p></div>}{service.procedure && <div className="mt-4"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Prosedur</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(service.procedure)}</p></div>}<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">{service.completion_time && <span><Clock3 className="mr-1 inline h-3.5 w-3.5"/>{service.completion_time}</span>}{service.fee && <span>Tarif: {service.fee}</span>}{service.application_url && <a href={service.application_url} target="_blank" rel="noreferrer" className="font-bold text-teal-700">Akses layanan <ArrowUpRight className="inline h-3.5 w-3.5"/></a>}</div></Panel>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada layanan yang dipublikasikan.</p></Panel>
}
function ProfileBoundaries({ profile, descriptions = {} }) {
  const entries = [['Utara', profile.batas_utara, descriptions.Utara], ['Selatan', profile.batas_selatan, descriptions.Selatan], ['Timur', profile.batas_timur, descriptions.Timur], ['Barat', profile.batas_barat, descriptions.Barat]].filter(([, value]) => value)
  if (!entries.length) return null
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{entries.map(([direction, value, description]) => <article key={direction} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-700">Batas {direction}</span><h3 className="text-base font-bold text-slate-900">{value}</h3>{description && <p className="text-xs leading-relaxed text-slate-500">{description}</p>}</article>)}</div>
}
function ProfileRegionPage({ portal, subdomain }) {
  const { website, profile } = portal
  const contents = portal.contents || {}
  const profileContent = contents.profil || {}
  const leader = contents['profil-pimpinan'] || {}
  const structure = contents['struktur-organisasi'] || {}
  const kelurahanList = Array.isArray(profileContent?.metadata?.kelurahan_list) ? profileContent.metadata.kelurahan_list : []
  const stats = [
    ['Luas Wilayah', profile?.luas_wilayah, 'km²', Ruler],
    ['Jumlah RW', profile?.jumlah_rw, 'RW', House],
    ['Jumlah RT', profile?.jumlah_rt, 'RT', House],
    ['Total Penduduk', profile?.total_jiwa, 'Jiwa', UsersRound],
    ['Jumlah KK', profile?.jumlah_kk, 'KK', House],
    ['Kepuasan Warga', profile?.kepuasan_warga, '%', BadgeCheck],
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
  const vision = plainContent(profile?.visi || '')
  const mission = plainContent(profile?.misi || '')
  const missionItems = mission.split(/\n+/).map((item) => item.replace(/^\s*(?:[-*•\d.)]+\s*)/, '').trim()).filter(Boolean)
  const leaderImage = Array.isArray(leader?.images) ? leader.images[0] : null
  const leaderImageUrl = leaderImage?.url || leaderImage?.path
  const leaderBody = plainContent(leader?.body || '')
  const leaderQuote = plainContent(leader?.metadata?.sambutan_quote || '')
  const boundaryDescriptions = profileContent.metadata?.boundary_descriptions || {}

  return <>
    <header className="relative overflow-hidden bg-gradient-to-br from-[#06141D] via-[#0B2538] to-[#0D645D] px-5 py-16 text-center text-white sm:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.45) 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
      <div className="relative mx-auto max-w-4xl">
        <span className="inline-flex rounded-lg border border-teal-300/30 bg-teal-400/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[.16em] text-teal-200">Informasi Kewilayahan</span>
        <h1 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl">Profil {website.name}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">Mengenal sejarah, letak geografis, demografi penduduk, dan tata kelola {website.name}.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3 text-xs font-bold">
        {[
            ['Gambaran Wilayah', '#gambaran-wilayah'],
            ['Visi & Misi', '#visi-misi'],
            ['Profil Pimpinan', '#profil-pimpinan'],
            ['Struktur Organisasi', '#struktur-organisasi'],
          ].filter(([label]) => label === 'Gambaran Wilayah' || (label === 'Visi & Misi' && portal.moduleVisibility?.profil !== false) || (label === 'Profil Pimpinan' && portal.moduleVisibility?.['profil-pimpinan'] !== false) || (label === 'Struktur Organisasi' && portal.moduleVisibility?.['struktur-organisasi'] !== false)).map(([label, href]) => <a key={href} href={href} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:border-teal-200/60 hover:bg-white/20">{label}</a>)}
        </div>
      </div>
    </header>
    <main className="mx-auto w-full max-w-[1240px] space-y-12 px-4 py-10 sm:px-6 sm:py-14 lg:space-y-16">
      {stats.length > 0 && <section aria-label="Statistik wilayah" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">{stats.map(([label, value, unit, Icon]) => <article key={label} className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md sm:p-5"><span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Icon aria-hidden="true" className="h-5 w-5"/></span><strong className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value} <span className="text-xs font-bold text-teal-700">{unit}</span></strong><span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span></article>)}</section>}

      {portal.moduleVisibility?.['profil-pimpinan'] !== false && <section id="profil-pimpinan" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10"><div className="grid items-center gap-7 lg:grid-cols-12 lg:gap-10"><div className="flex flex-col items-center text-center lg:col-span-4">{leaderImageUrl && <div className="mb-4 h-48 w-48 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md sm:h-56 sm:w-56"><img src={leaderImageUrl} alt={leader.title || `Pimpinan ${website.name}`} className="h-full w-full object-cover object-top" loading="lazy"/></div>}<span className="mb-2 rounded-full border border-teal-500/20 bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">Profil Pimpinan</span><h2 className="text-xl font-extrabold leading-snug text-slate-900">{leader.title || `Pimpinan ${website.name}`}</h2>{leader.metadata?.pangkat_golongan && <p className="mt-1 text-xs font-medium text-slate-500">{leader.metadata.pangkat_golongan}</p>}</div><div className="space-y-4 lg:col-span-8"><span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-700"><BadgeCheck className="h-4 w-4"/>Sambutan Pimpinan</span>{leaderQuote && <blockquote className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm italic leading-7 text-slate-600"><span aria-hidden="true" className="absolute right-4 top-1 text-4xl font-black text-teal-700/15">“</span><p className="relative">{leaderQuote}</p></blockquote>}{leaderBody ? <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{leaderBody}</p> : !leaderQuote && <p className="text-sm text-slate-500">Informasi pimpinan belum tersedia.</p>}<FileLinks files={leader.files}/></div></div></section>}

      {(profile || contentIsFilled(profileContent)) && <section id="gambaran-wilayah" className="scroll-mt-24 space-y-5"><div className="mx-auto max-w-2xl space-y-2 text-center"><span className="inline-flex rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">Geografis &amp; Letak</span><h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Gambaran Umum &amp; Batas Wilayah</h2><p className="text-sm leading-relaxed text-slate-600">Batas administrasi wilayah {website.name} dan keterangan singkat pada setiap sisi.</p></div><ProfileBoundaries profile={profile || {}} descriptions={boundaryDescriptions}/>{profile?.maps_embed_url ? <Panel><h3 className="font-extrabold">Peta Wilayah</h3><GoogleMap url={profile.maps_embed_url} title={'Peta wilayah ' + website.name}/></Panel> : <Panel><h3 className="font-extrabold">Peta Wilayah</h3><p className="mt-3 text-sm text-slate-500">Peta wilayah belum ditambahkan.</p></Panel>}</section>}

      {portal.moduleVisibility?.profil !== false && <section id="visi-misi" className="relative space-y-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#06141D] via-[#0B2538] to-[#0D9488] p-6 text-white shadow-xl sm:space-y-9 sm:p-10"><div className="pointer-events-none absolute -bottom-8 -right-6 select-none text-white/10"><BadgeCheck className="h-40 w-40 sm:h-52 sm:w-52"/></div><div className="relative z-10 text-center"><span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-200">Pedoman Pelayanan</span><h2 className="mt-3 text-2xl font-extrabold sm:text-4xl">Visi &amp; Misi {website.name}</h2></div>{vision ? <article className="relative z-10 mx-auto max-w-4xl rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-sm sm:p-8"><div className="mb-3 inline-flex items-center gap-2 text-teal-200"><Flag className="h-5 w-5"/><h3 className="text-sm font-bold uppercase tracking-widest">Visi</h3></div><p className="whitespace-pre-line text-base font-semibold italic leading-relaxed sm:text-xl">{vision}</p></article> : <p className="relative z-10 text-center text-sm text-teal-50">Visi belum diisi pada Kelola Konten &gt; Profil.</p>}{missionItems.length > 0 && <div className="relative z-10 space-y-4"><h3 className="text-center text-sm font-bold uppercase tracking-widest text-teal-200">Misi</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{missionItems.map((item, index) => <article key={index + '-' + item} className="relative min-h-36 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><span aria-hidden="true" className="absolute right-3 top-0 text-5xl font-black text-white/10">{String(index + 1).padStart(2, '0')}</span><span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-teal-300/30 bg-teal-500/20 text-xs font-bold text-teal-100">{String(index + 1).padStart(2, '0')}</span><p className="relative mt-3 text-sm leading-relaxed text-slate-100">{item}</p></article>)}</div></div>}</section>}

      <section id="daftar-kelurahan" className="scroll-mt-24 space-y-5"><div className="mx-auto max-w-2xl space-y-2 text-center"><span className="inline-flex rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">Wilayah Kerja</span><h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Daftar Kelurahan</h2><p className="text-sm text-slate-600">Kelurahan yang berada di bawah wilayah administratif {website.name}.</p></div>{kelurahanList.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kelurahanList.map((ward, index) => <article key={`${ward.nama}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"><span className="absolute -bottom-3 right-3 select-none text-6xl font-black text-slate-100">{String(index + 1).padStart(2, '0')}</span><div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700"><House className="h-3.5 w-3.5"/>Kelurahan {String(index + 1).padStart(2, '0')}</span><h3 className="mt-3 text-lg font-bold text-slate-900">{ward.nama}</h3>{ward.deskripsi && <p className="mt-2 text-sm leading-relaxed text-slate-500">{ward.deskripsi}</p>}</div></article>)}</div> : <Panel className="text-center"><House className="mx-auto h-8 w-8 text-teal-700"/><p className="mt-3 text-sm text-slate-500">Data daftar kelurahan belum tersedia.</p></Panel>}</section>

      {portal.moduleVisibility?.['struktur-organisasi'] !== false && <section id="struktur-organisasi" className="scroll-mt-24 space-y-5"><div className="mx-auto max-w-2xl space-y-2 text-center"><span className="inline-flex rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">Tata Kelola Pemerintahan</span><h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Struktur Organisasi {website.name}</h2><p className="text-sm text-slate-600">Bagan hierarki pembagian tugas dan fungsi aparatur wilayah.</p></div><Panel>{plainContent(structure.body || '') && <p className="mb-4 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(structure.body)}</p>}<OrganizationStructureViewer content={structure} headerTitle={structure.title || 'Bagan Susunan Organisasi'} subtitle="Informasi struktur dari pengelolaan konten website."/><FileLinks files={structure.files}/></Panel></section>}

      {!stats.length && !contentIsFilled(leader) && !contentIsFilled(profileContent) && !vision && !mission && !contentIsFilled(structure) && <Panel><p className="text-sm text-slate-500">Informasi profil wilayah belum tersedia. Silakan lengkapi modul Profil, Profil Pimpinan, dan Struktur Organisasi melalui Kelola Konten.</p></Panel>}
      <div className="flex justify-center"><Link href={`/${subdomain}#arsip`} className="inline-flex items-center gap-2 rounded-full border border-teal-700/20 bg-white px-5 py-2.5 text-sm font-bold text-teal-700 shadow-sm hover:bg-teal-50"><ArrowLeft className="h-4 w-4"/>Kembali ke Arsip & Modul</Link></div>
    </main>
  </>
}
function ModuleRecords({ slug, portal }) {
  if (slug === 'struktur-organisasi') {
    const content = portal.contents[slug]
    return <Panel>{plainContent(content?.body || '') && <p className="mb-4 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(content.body)}</p>}<OrganizationStructureViewer content={content || {}} headerTitle={content?.title || `Struktur Organisasi ${portal.website.name}`}/><FileLinks files={content?.files}/></Panel>
  }
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
  if (slug === 'profil') return portal.profile ? <div className="space-y-4"><Panel><h2 className="font-extrabold">Data Wilayah {portal.website.name}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Luas Wilayah',portal.profile.luas_wilayah,'km²'],['Jumlah RW',portal.profile.jumlah_rw,'RW'],['Jumlah RT',portal.profile.jumlah_rt,'RT'],['Jumlah KK',portal.profile.jumlah_kk,'KK'],['Total Penduduk',portal.profile.total_jiwa,'Jiwa'],['Kepuasan Warga',portal.profile.kepuasan_warga,'%']].filter(([,value])=>value).map(([label,value,unit])=><div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-extrabold text-teal-700">{value} {unit}</p></div>)}</div><div id="visi-misi" className="scroll-mt-24">{portal.profile.visi && <div className="mt-5"><h3 className="text-xs font-bold uppercase text-slate-500">Visi</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(portal.profile.visi)}</p></div>}{portal.profile.misi && <div className="mt-4"><h3 className="text-xs font-bold uppercase text-slate-500">Misi</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(portal.profile.misi)}</p></div>}</div><ProfileBoundaries profile={portal.profile}/></Panel>{portal.profile.maps_embed_url && <Panel><h2 className="font-extrabold">Peta Wilayah</h2><GoogleMap url={portal.profile.maps_embed_url} title={`Peta wilayah ${portal.website.name}`}/></Panel>}</div> : <Panel><p className="text-sm text-slate-500">Data profil wilayah belum tersedia.</p></Panel>

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
  const profileSectionRoutes = {
    'profil-pimpinan': 'profil-pimpinan',
    'struktur-organisasi': 'struktur-organisasi',
  }
  if (profileSectionRoutes[moduleSlug] && portal.moduleVisibility?.[moduleSlug] !== false && portal.moduleVisibility?.profil !== false) {
    redirect(`/${subdomain}/profil#${profileSectionRoutes[moduleSlug]}`)
  }
  const portalModule = portal.modules.find((entry) => entry.slug === moduleSlug)
  if (!portalModule) notFound()
  if (moduleSlug === 'profil') {
    return <div className="public-portal min-h-screen bg-slate-50 text-slate-900"><PortalHeader website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/><ProfileRegionPage portal={portal} subdomain={subdomain}/><PortalFooter website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/></div>
  }
  const recordModules = ['layanan','berita','agenda-kegiatan','pengumuman','inovasi','galeri-gambar','galeri-video','kontak','profil','struktur-organisasi']
  const genericContent = portal.contents[moduleSlug]
  return <div className="public-portal min-h-screen bg-slate-50 text-slate-900"><PortalHeader website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/><main className="mx-auto w-full max-w-[1440px] space-y-7 px-5 py-8 sm:py-12 lg:px-10"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Link href={`/${subdomain}`} className="inline-flex items-center gap-2 text-xs font-bold text-teal-700"><ArrowLeft className="h-4 w-4"/>Kembali ke beranda</Link><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-700">{portal.website.name} · Arsip & Modul</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{portalModule.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">{portalModule.description}</p></div><ModuleRecords slug={moduleSlug} portal={portal}/>{moduleSlug !== 'struktur-organisasi' && contentIsFilled(genericContent) && <ContentPanel module={portalModule} content={genericContent}/>}{!recordModules.includes(moduleSlug) && !contentIsFilled(genericContent) && <Panel><p className="text-sm text-slate-500">Belum ada konten yang dipublikasikan untuk modul ini.</p></Panel>}</main><PortalFooter website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/></div>
}
