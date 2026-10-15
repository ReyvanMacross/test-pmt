import Link from 'next/link'
import { ArrowRight, Bell, CalendarDays, Clock3, ContactRound, FileText, FolderTree, Image as ImageIcon, Info, Lightbulb, MapPin, ShieldCheck, UsersRound, Video, Home, ClipboardList, Landmark, BadgeCheck, TableProperties, LockKeyhole, CalendarClock, Clock4, TriangleAlert, Inbox, MessageSquareWarning, Newspaper, Images, Network, Radio, Star, Phone } from 'lucide-react'
import { contentIsFilled, plainContent } from '@/lib/public-kecamatan'
import { PortalFooter, PortalHeader } from './PortalChrome'
import HeroSlider from './HeroSlider'

function SectionTitle({ eyebrow, title, href, linkLabel = 'Lihat selengkapnya' }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><span className="inline-flex rounded-md bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-teal-700">{eyebrow}</span><h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h2></div>{href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900">{linkLabel}<ArrowRight className="h-3.5 w-3.5"/></Link>}</div>
}

function EmptySafeText({ value, className = '' }) {
  const text = plainContent(value || '')
  return text ? <p className={`whitespace-pre-line ${className}`}>{text}</p> : null
}

function PublicModuleCards({ portal }) {
  const iconBySlug = {
    profil: ContactRound, beranda: Home, 'program-dan-kegiatan': ClipboardList, 'struktur-organisasi': Network, 'profil-pimpinan': Star, layanan: Radio, kontak: Phone, ppid: ShieldCheck, 'ppid-utama': ShieldCheck, 'daftar-informasi-publik': Info, 'daftar-informasi-dikecualikan': LockKeyhole, 'informasi-wajib-berkala': CalendarClock, 'informasi-tersedia-setiap-saat': Clock4, 'informasi-serta-merta': TriangleAlert, 'permohonan-informasi-online': Inbox, 'pengajuan-keberatan-online': MessageSquareWarning, inovasi: Lightbulb, berita: Newspaper, 'galeri-gambar': ImageIcon, 'galeri-video': Video, informasi: Info, pengumuman: Bell, 'agenda-kegiatan': CalendarDays,
  }
  const titles = {
    profil: 'Profil Instansi', 'program-dan-kegiatan': 'Program & Kegiatan', 'profil-pimpinan': 'Profil Pimpinan', layanan: 'Layanan Publik', inovasi: 'Inovasi Wilayah', 'galeri-gambar': 'Galeri Foto', 'galeri-video': 'Galeri Video', ppid: 'Layanan PPID', 'daftar-informasi-publik': 'Daftar Info Publik', kontak: 'Kontak & Lokasi', berita: 'Berita & Publikasi',
  }
  const descriptions = {
    profil: 'Sejarah dan profil umum wilayah', 'profil-visi-misi': 'Arah, cita-cita, dan misi wilayah.', beranda: 'Informasi utama dan sambutan wilayah', 'program-dan-kegiatan': 'Agenda kerja strategis instansi', 'struktur-organisasi': 'Bagan tata kelola dan hierarki tugas', 'profil-pimpinan': 'Biodata Camat dan Pejabat Struktural', layanan: 'Katalog izin, e-KTP, dan KK', kontak: 'Hotline WhatsApp, call center 112', ppid: 'Permohonan informasi publik & transparansi', 'ppid-utama': 'Integrasi informasi PPID utama', 'daftar-informasi-publik': 'Informasi berkala dan tersedia setiap saat', 'daftar-informasi-dikecualikan': 'Daftar informasi yang dikecualikan', 'informasi-wajib-berkala': 'Laporan dan dokumen berkala', 'informasi-tersedia-setiap-saat': 'Dokumen yang tersedia setiap saat', 'informasi-serta-merta': 'Informasi darurat dan keselamatan publik', 'permohonan-informasi-online': 'Tata cara permohonan informasi', 'pengajuan-keberatan-online': 'Prosedur pengajuan keberatan informasi', inovasi: 'Program terobosan dan sistem digital', berita: 'Arsip rilis berita dan siaran pers', 'galeri-gambar': 'Dokumentasi kegiatan aparat & warga', 'galeri-video': 'Dokumentasi video liputan dan edukasi', informasi: 'Informasi umum dan publikasi', pengumuman: 'Surat edaran & pemberitahuan resmi', 'agenda-kegiatan': 'Jadwal acara kedinasan & musrenbang',
  }
  const base = `/${portal.website.subdomain}`
  const moduleBySlug = new Map(portal.modules.map((module) => [module.slug, module]))
  // Modul beranda dan hero sudah tampil sebagai bagian halaman utama. Submodul
  // PPID diringkas ke kartu induknya agar arsip tidak mengulang menu yang sama.
  const archiveGroups = [
    { slugs: ['profil'] },
    {
      slugs: ['profil'],
      archiveSlug: 'profil-visi-misi',
      title: 'Visi & Misi',
      href: `${base}/profil#visi-misi`,
      iconSlug: 'profil-pimpinan',
    },
    { slugs: ['program-dan-kegiatan'] },
    { slugs: ['struktur-organisasi'] },
    { slugs: ['profil-pimpinan'] },
    { slugs: ['layanan'] },
    { slugs: ['inovasi'] },
    { slugs: ['agenda-kegiatan'] },
    { slugs: ['pengumuman'] },
    { slugs: ['galeri-gambar'] },
    { slugs: ['galeri-video'] },
    { slugs: ['ppid', 'ppid-utama', 'permohonan-informasi-online', 'pengajuan-keberatan-online'], title: 'Layanan PPID' },
    { slugs: ['kontak'] },
    { slugs: ['berita'] },
    { slugs: ['daftar-informasi-publik', 'daftar-informasi-dikecualikan', 'informasi-wajib-berkala', 'informasi-tersedia-setiap-saat', 'informasi-serta-merta'], title: 'Daftar Info Publik' },
  ]
  const visibleModules = archiveGroups.flatMap(({ slugs, title, archiveSlug, href, iconSlug }) => {
    const moduleEntry = slugs.map((slug) => moduleBySlug.get(slug)).find(Boolean)
    return moduleEntry ? [{ ...moduleEntry, ...(archiveSlug ? { slug: archiveSlug } : {}), ...(title ? { title } : {}), ...(href ? { href } : {}), ...(iconSlug ? { iconSlug } : {}) }] : []
  })
  return <section id="arsip" className="bg-slate-50 px-5 py-14 sm:py-16 lg:px-10"><div className="mx-auto w-full max-w-[1440px]"><div className="mb-8 text-center"><span className="inline-flex rounded-md bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-teal-700">Navigasi Portal</span><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Arsip &amp; Modul Dokumen Resmi</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Akses cepat menuju seluruh dokumen resmi, struktur organisasi, dan formulir permohonan layanan publik terpadu.</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{visibleModules.map((module) => { const Icon = iconBySlug[module.iconSlug || module.slug] || FileText; return <Link key={module.slug} href={module.href || `${base}/${module.slug}`} className="group relative flex min-h-[152px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg hover:shadow-slate-200/50"><span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 opacity-0 transition-opacity group-hover:opacity-100"/><span><span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-600 group-hover:text-white"><Icon aria-hidden="true" className="h-5 w-5"/></span><span className="block text-sm font-bold leading-tight text-slate-900 transition-colors group-hover:text-teal-700">{titles[module.slug] || module.title}</span><span className="mt-1 block line-clamp-2 text-[11px] leading-relaxed text-slate-400">{descriptions[module.slug] || module.description}</span></span><span className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-600">Akses menu <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"/></span></Link>})}</div></div></section>
}

export default function PublicKecamatanHome({ portal }) {
  const { website, profile, contents, news, announcements, agendas, services, innovations, heroSlides = [] } = portal
  const isModuleEnabled = (slug) => portal.moduleVisibility?.[slug] !== false
  const base = `/${website.subdomain}`
  const homeContent = contents.beranda
  const profileContent = contents.profil
  const introductionTitle = homeContent?.title?.trim()
  const introductionBody = plainContent(homeContent?.body)
  const hasIntroduction = Boolean(introductionTitle || introductionBody)
  const profileFallback = profileContent?.body && profileContent.body !== 'Konten profil wilayah' ? profileContent.body : ''
  const profileSummary = plainContent(profile?.visi || profileFallback)
  const latestNews = isModuleEnabled('berita') ? news.slice(0, 3) : []
  const upcomingAgenda = isModuleEnabled('agenda-kegiatan') ? agendas.filter((item) => new Date(item.end_date || item.start_date) >= new Date(new Date().toDateString())).slice(0, 3) : []
  const stats = [
    ['Luas Wilayah', profile?.luas_wilayah, 'km²'], ['Rukun Warga', profile?.jumlah_rw, 'RW'], ['Rukun Tetangga', profile?.jumlah_rt, 'RT'], ['Total Penduduk', profile?.total_jiwa, 'Jiwa'],
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
  const hasProfile = isModuleEnabled('profil') && Boolean(profileSummary || profile?.misi || stats.length)

  return <div className="public-portal min-h-screen bg-white text-slate-900" data-portal-template={website.template_slug || 'kecamatan'}><PortalHeader website={website} profile={profile} moduleVisibility={portal.moduleVisibility} announcements={announcements}/>
    {isModuleEnabled('hero-slider') && heroSlides.length > 0 && <HeroSlider slides={heroSlides} website={website} base={base} moduleVisibility={portal.moduleVisibility} announcements={announcements}/>}

    {isModuleEnabled('beranda') && hasIntroduction && <section className="border-b border-slate-100 bg-white px-5 py-10 text-center sm:py-12 lg:px-10"><div className="mx-auto max-w-3xl"><span className="inline-flex rounded-md bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-teal-700">Integritas & Transparansi</span>{introductionTitle && <h2 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{introductionTitle}</h2>}{introductionBody && <p className="mx-auto mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{introductionBody}</p>}</div></section>}

    {isModuleEnabled('program-dan-kegiatan') && contentIsFilled(contents['program-dan-kegiatan']) && <section className="border-b border-slate-100 bg-white px-5 py-10 sm:py-12 lg:px-10"><div className="mx-auto max-w-3xl text-center"><span className="inline-flex rounded-md bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-teal-700">Program Wilayah</span><h2 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{contents['program-dan-kegiatan'].title || 'Program dan Kegiatan'}</h2><EmptySafeText value={contents['program-dan-kegiatan'].body} className="mx-auto mt-3 text-sm leading-relaxed text-slate-600"/><Link href={`${base}/program-dan-kegiatan`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900">Lihat program dan kegiatan<ArrowRight className="h-4 w-4"/></Link></div></section>}

    {isModuleEnabled('layanan') && services.length > 0 && <section className="px-5 py-12 sm:py-14 lg:px-10"><div className="mx-auto w-full max-w-[1440px]"><div className="mx-auto mb-8 max-w-2xl text-center"><span className="rounded-md bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-teal-700">Layanan Prioritas Warga</span><h2 className="mt-3 text-xl font-extrabold sm:text-2xl">Akses Cepat Pengurusan Dokumen & Pengaduan</h2></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.slice(0, 6).map((service, index) => <article key={service.id} className={`flex flex-col rounded-2xl border border-slate-200 border-t-[3px] bg-white p-5 shadow-sm ${['border-t-teal-500','border-t-amber-500','border-t-blue-500'][index % 3]}`}><span className="text-[10px] font-extrabold uppercase tracking-wide text-teal-700">{service.category || 'Layanan Publik'}</span><h3 className="mt-2 font-bold">{service.name}</h3><EmptySafeText value={service.description} className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500"/>{service.requirements && <p className="mt-2 line-clamp-2 text-[11px] text-slate-500">Persyaratan: {plainContent(service.requirements)}</p>}<Link href={`${base}/layanan`} className="mt-auto inline-flex items-center gap-1 border-t border-slate-100 pt-4 mt-4 text-[11px] font-extrabold text-teal-700">{service.application_url ? 'Mulai layanan' : 'Lihat detail layanan'}<ArrowRight className="h-3.5 w-3.5"/></Link></article>)}</div></div></section>}

    {hasProfile && <section className="border-y border-slate-100 bg-slate-50 px-5 py-12 sm:py-16 lg:px-10"><div className="mx-auto w-full max-w-[1440px]"><div className="mb-6 text-center"><span className="rounded-md bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.15em] text-teal-700">Data & Wilayah</span><h2 className="mt-3 text-2xl font-extrabold">Profil {website.name}</h2><p className="mt-2 text-xs text-slate-500">Gambaran umum letak administratif, potensi kewilayahan, serta operasional aparatur.</p></div><div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]"><article className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold">Tentang {website.name}</h3><EmptySafeText value={profileSummary} className="mt-3 text-xs leading-relaxed text-slate-600"/>{profile?.misi && <div className="mt-3 border-t border-slate-100 pt-3"><h4 className="text-xs font-bold">Misi Wilayah</h4><EmptySafeText value={profile.misi} className="mt-1 text-xs leading-relaxed text-slate-600"/></div>}{stats.length > 0 && <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4">{stats.map(([label, value, unit]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</span><strong className="mt-1 block text-lg font-black text-teal-700">{value} <small className="text-[10px] font-semibold">{unit}</small></strong></div>)}</div>}</article>{isModuleEnabled('kontak') && (profile?.contact_address || profile?.operating_hours || profile?.office_phone || profile?.official_email) && <aside className="rounded-2xl bg-[#071923] p-6 text-white"><span className="rounded bg-teal-800 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-teal-200">Aparatur Kewilayahan</span><h3 className="mt-3 font-bold">Kantor {website.name}</h3>{profile.contact_address && <p className="mt-2 text-xs leading-relaxed text-slate-300">{profile.contact_address}</p>}<dl className="mt-5 space-y-3 border-t border-white/10 pt-4 text-[11px]">{profile.operating_hours && <div className="flex justify-between gap-3"><dt className="text-slate-400">Jam Pelayanan</dt><dd className="text-right font-semibold text-teal-200">{profile.operating_hours}</dd></div>}{profile.office_phone && <div className="flex justify-between gap-3"><dt className="text-slate-400">Call Center</dt><dd className="text-right font-semibold">{profile.office_phone}</dd></div>}{profile.official_email && <div className="flex justify-between gap-3"><dt className="text-slate-400">Email Resmi</dt><dd className="break-all text-right font-semibold text-teal-200">{profile.official_email}</dd></div>}</dl></aside>}</div></div></section>}

    {(latestNews.length > 0 || upcomingAgenda.length > 0) && <section className="px-5 py-12 sm:py-16 lg:px-10"><div className="mx-auto w-full max-w-[1440px]">{latestNews.length > 0 && <div><SectionTitle eyebrow="Publikasi Terkini" title="Kabar & Berita Wilayah" href={`${base}/berita`}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{latestNews.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><Link href={item.body ? `${base}/berita/${item.id}` : item.url || `${base}/berita`} target={!item.body && item.url ? "_blank" : undefined} rel={!item.body && item.url ? "noreferrer" : undefined} className="block">{item.image ? <img src={item.image} alt="" className="h-44 w-full object-cover" loading="lazy" referrerPolicy="no-referrer"/> : <div className="flex h-44 items-center justify-center bg-gradient-to-br from-teal-900 to-blue-900 text-white"><FileText className="h-8 w-8 opacity-60"/></div>}<div className="p-5"><p className="text-[10px] font-semibold text-slate-400">{item.source_domain || 'Kabar Kecamatan'} · {new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(item.created_at))}</p><h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug">{item.title}</h3><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">{item.excerpt}</p><span className="mt-4 inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-700">Baca selengkapnya<ArrowRight className="h-3 w-3"/></span></div></Link></article>)}</div></div>}
      {upcomingAgenda.length > 0 && <div className={latestNews.length > 0 ? 'mt-12' : ''}><SectionTitle eyebrow="Agenda Kewilayahan" title="Agenda Kegiatan" href={`${base}/agenda-kegiatan`}/><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{upcomingAgenda.map((item) => <article key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"><span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-50 text-teal-700"><CalendarDays className="h-4 w-4"/><span className="text-[9px] font-bold">{new Date(item.start_date).toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</span></span><div><h3 className="text-sm font-bold">{item.title}</h3><p className="mt-1 line-clamp-2 text-xs text-slate-500">{plainContent(item.description)}</p>{item.time_range && <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-teal-700"><Clock3 className="h-3 w-3"/>{item.time_range}</p>}{item.location && <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500"><MapPin className="h-3 w-3"/>{item.location}</p>}</div></article>)}</div></div>}
    </div></section>}

    {isModuleEnabled('inovasi') && innovations.length > 0 && <section className="px-5 py-12 lg:px-10"><div className="mx-auto w-full max-w-[1440px]"><SectionTitle eyebrow="Gagasan & Layanan" title="Inovasi Wilayah" href={`${base}/inovasi`}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{innovations.slice(0,3).map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{item.cover_path && <img src={item.cover_path} alt="" className="h-40 w-full object-cover" loading="lazy"/>}<div className="p-5"><h3 className="font-bold">{item.title}</h3><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">{plainContent(item.description)}</p>{item.launch_year && <p className="mt-3 text-[10px] font-bold text-teal-700">Diluncurkan {item.launch_year}</p>}</div></article>)}</div></div></section>}

    <PublicModuleCards portal={portal}/>
    <PortalFooter website={website} profile={profile} moduleVisibility={portal.moduleVisibility}/>
  </div>
}
