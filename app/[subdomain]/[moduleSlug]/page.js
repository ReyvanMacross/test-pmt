import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, BadgeCheck, FileText, Flag, House, MapPin, Ruler, UsersRound } from 'lucide-react'
import { contentIsFilled, plainContent, getKecamatanPortal, getKecamatanWebsite } from '@/lib/public-kecamatan'
import { CONTENT_MODULES } from '@/lib/content-modules'
import { PortalFooter, PortalHeader } from '../PortalChrome'
import PublicPageHero from '../PublicPageHero'
import OrganizationStructureViewer from './OrganizationStructureViewer'
import NewsArchive from './NewsArchive'
import AgendaCalendar from './AgendaCalendar'
import ContactPage from './ContactPage'
import OfficialDocumentsArchive from './OfficialDocumentsArchive'
import OfficialDocumentDetail from './OfficialDocumentDetail'
import ProgramInnovationPage from './ProgramInnovationPage'
import PublicGallery from './PublicGallery'
import ServiceCatalog from './ServiceCatalog'
import { PUBLIC_DOCUMENT_MODULES, PUBLIC_DOCUMENT_MODULE_SLUGS } from '@/lib/public-documents'
import { sanitizeRichHtml } from '@/lib/rich-text'

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
  const body = sanitizeRichHtml(content.body)
  return <Panel><h2 className="text-lg font-extrabold">{content.title || module.title}</h2>{module.slug === 'profil-pimpinan' && content.metadata?.pangkat_golongan && <p className="mt-2 text-sm font-semibold text-teal-700">Pangkat / Golongan PNS: {content.metadata.pangkat_golongan}</p>}{body && <div className="rich-content mt-4 text-sm leading-7 text-slate-600" dangerouslySetInnerHTML={{ __html: body }}/>}<FileLinks files={content.files} images={content.images}/></Panel>
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
  const leaderBody = sanitizeRichHtml(leader?.body || '')
  const leaderQuote = plainContent(leader?.metadata?.sambutan_quote || '')
  const boundaryDescriptions = profileContent.metadata?.boundary_descriptions || {}
  const hasBoundaryData = website.template_slug === 'dinas'
    ? Boolean(profile?.maps_embed_url)
    : Boolean(profile?.batas_utara || profile?.batas_selatan || profile?.batas_timur || profile?.batas_barat || profile?.maps_embed_url || Object.values(boundaryDescriptions).some(Boolean))

  return <>
    <main className="mx-auto w-full max-w-[1240px] space-y-12 px-4 py-10 sm:px-6 sm:py-14 lg:space-y-16">
      {stats.length > 0 && <section aria-label="Statistik wilayah" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">{stats.map(([label, value, unit, Icon]) => <article key={label} className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md sm:p-5"><span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Icon aria-hidden="true" className="h-5 w-5"/></span><strong className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{value} <span className="text-xs font-bold text-teal-700">{unit}</span></strong><span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span></article>)}</section>}

      {portal.moduleVisibility?.['profil-pimpinan'] !== false && <section id="profil-pimpinan" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10"><div className="grid items-center gap-7 lg:grid-cols-12 lg:gap-10"><div className="flex flex-col items-center text-center lg:col-span-4">{leaderImageUrl && <div className="mb-4 h-48 w-48 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md sm:h-56 sm:w-56"><img src={leaderImageUrl} alt={leader.title || `Pimpinan ${website.name}`} className="h-full w-full object-cover object-top" loading="lazy"/></div>}<span className="mb-2 rounded-full border border-teal-500/20 bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">Profil Pimpinan</span><h2 className="text-xl font-extrabold leading-snug text-slate-900">{leader.title || `Pimpinan ${website.name}`}</h2>{leader.metadata?.pangkat_golongan && <p className="mt-1 text-xs font-medium text-slate-500">{leader.metadata.pangkat_golongan}</p>}</div><div className="space-y-4 lg:col-span-8"><span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-700"><BadgeCheck className="h-4 w-4"/>Sambutan Pimpinan</span>{leaderQuote && <blockquote className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm italic leading-7 text-slate-600"><span aria-hidden="true" className="absolute right-4 top-1 text-4xl font-black text-teal-700/15">“</span><p className="relative">{leaderQuote}</p></blockquote>}{leaderBody ? <div className="rich-content text-sm leading-7 text-slate-600" dangerouslySetInnerHTML={{ __html: leaderBody }}/> : !leaderQuote && <p className="text-sm text-slate-500">Informasi pimpinan belum tersedia.</p>}<FileLinks files={leader.files}/></div></div></section>}

      {hasBoundaryData && <section id="gambaran-wilayah" className="scroll-mt-24 space-y-5"><div className="mx-auto max-w-2xl space-y-2 text-center"><span className="inline-flex rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">{website.template_slug === 'dinas' ? 'Lokasi Instansi' : 'Geografis & Letak'}</span><h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{website.template_slug === 'dinas' ? `Lokasi ${website.name}` : 'Gambaran Umum & Batas Wilayah'}</h2>{website.template_slug !== 'dinas' && <p className="text-sm leading-relaxed text-slate-600">Batas administrasi wilayah {website.name} dan keterangan singkat pada setiap sisi.</p>}</div>{website.template_slug !== 'dinas' && <ProfileBoundaries profile={profile || {}} descriptions={boundaryDescriptions}/>}{profile?.maps_embed_url && <Panel><h3 className="font-extrabold">{website.template_slug === 'dinas' ? 'Peta Lokasi Kantor' : 'Peta Wilayah'}</h3><GoogleMap url={profile.maps_embed_url} title={'Peta ' + (website.template_slug === 'dinas' ? 'lokasi ' : 'wilayah ') + website.name}/></Panel>}</section>}

      {portal.moduleVisibility?.profil !== false && <section id="visi-misi" className="relative space-y-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#06141D] via-[#0B2538] to-[#0D9488] p-6 text-white shadow-xl sm:space-y-9 sm:p-10"><div className="pointer-events-none absolute -bottom-8 -right-6 select-none text-white/10"><BadgeCheck className="h-40 w-40 sm:h-52 sm:w-52"/></div><div className="relative z-10 text-center"><span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-200">Pedoman Pelayanan</span><h2 className="mt-3 text-2xl font-extrabold sm:text-4xl">Visi &amp; Misi {website.name}</h2></div>{vision ? <article className="relative z-10 mx-auto max-w-4xl rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-sm sm:p-8"><div className="mb-3 inline-flex items-center gap-2 text-teal-200"><Flag className="h-5 w-5"/><h3 className="text-sm font-bold uppercase tracking-widest">Visi</h3></div><p className="whitespace-pre-line text-base font-semibold italic leading-relaxed sm:text-xl">{vision}</p></article> : <p className="relative z-10 text-center text-sm text-teal-50">Visi belum diisi pada Kelola Konten &gt; Profil.</p>}{missionItems.length > 0 && <div className="relative z-10 space-y-4"><h3 className="text-center text-sm font-bold uppercase tracking-widest text-teal-200">Misi</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{missionItems.map((item, index) => <article key={index + '-' + item} className="relative min-h-36 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><span aria-hidden="true" className="absolute right-3 top-0 text-5xl font-black text-white/10">{String(index + 1).padStart(2, '0')}</span><span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-teal-300/30 bg-teal-500/20 text-xs font-bold text-teal-100">{String(index + 1).padStart(2, '0')}</span><p className="relative mt-3 text-sm leading-relaxed text-slate-100">{item}</p></article>)}</div></div>}</section>}

      <section id="daftar-kelurahan" className="scroll-mt-24 space-y-5"><div className="mx-auto max-w-2xl space-y-2 text-center"><span className="inline-flex rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">Wilayah Kerja</span><h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Daftar Kelurahan</h2><p className="text-sm text-slate-600">Kelurahan yang berada di bawah wilayah administratif {website.name}.</p></div>{kelurahanList.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kelurahanList.map((ward, index) => <article key={`${ward.nama}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"><span className="absolute -bottom-3 right-3 select-none text-6xl font-black text-slate-100">{String(index + 1).padStart(2, '0')}</span><div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700"><House className="h-3.5 w-3.5"/>Kelurahan {String(index + 1).padStart(2, '0')}</span><h3 className="mt-3 text-lg font-bold text-slate-900">{ward.nama}</h3>{ward.deskripsi && <p className="mt-2 text-sm leading-relaxed text-slate-500">{ward.deskripsi}</p>}</div></article>)}</div> : <Panel className="text-center"><House className="mx-auto h-8 w-8 text-teal-700"/><p className="mt-3 text-sm text-slate-500">Data daftar kelurahan belum tersedia.</p></Panel>}</section>

      {portal.moduleVisibility?.['struktur-organisasi'] !== false && <section id="struktur-organisasi" className="scroll-mt-24 space-y-5"><div className="mx-auto max-w-2xl space-y-2 text-center"><span className="inline-flex rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">Tata Kelola Pemerintahan</span><h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Struktur Organisasi {website.name}</h2><p className="text-sm text-slate-600">Bagan hierarki pembagian tugas dan fungsi aparatur wilayah.</p></div><Panel>{plainContent(structure.body || '') && <p className="mb-4 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(structure.body)}</p>}<OrganizationStructureViewer content={structure} headerTitle={structure.title || 'Bagan Susunan Organisasi'} subtitle="Informasi struktur dari pengelolaan konten website."/><FileLinks files={structure.files}/></Panel></section>}

      {!stats.length && !contentIsFilled(leader) && !contentIsFilled(profileContent) && !vision && !mission && !contentIsFilled(structure) && <Panel><p className="text-sm text-slate-500">Informasi profil wilayah belum tersedia. Silakan lengkapi modul Profil, Profil Pimpinan, dan Struktur Organisasi melalui Kelola Konten.</p></Panel>}
    </main>
  </>
}
function ModuleRecords({ slug, portal }) {
  if (slug === 'program-dan-kegiatan') return <ProgramInnovationPage website={portal.website} content={portal.contents[slug]} innovations={portal.innovations} showProgram={portal.moduleVisibility?.[slug] !== false} showInnovations={portal.moduleVisibility?.inovasi !== false}/>
  if (slug === 'inovasi') return <ProgramInnovationPage website={portal.website} innovations={portal.innovations} showProgram={false} showInnovations/>
  const documentModule = PUBLIC_DOCUMENT_MODULES.find((entry) => entry.slug === slug)
  if (documentModule) {
    const moduleMeta = CONTENT_MODULES.find((entry) => entry.slug === slug)
    return <OfficialDocumentDetail website={portal.website} module={moduleMeta} content={portal.contents[slug]}/>
  }
  if (slug === 'struktur-organisasi') {
    const content = portal.contents[slug]
    const body = sanitizeRichHtml(content?.body || '')
    return <Panel>{body && <div className="rich-content mb-4 text-sm leading-7 text-slate-600" dangerouslySetInnerHTML={{ __html: body }}/>}<OrganizationStructureViewer content={content || {}} headerTitle={content?.title || `Struktur Organisasi ${portal.website.name}`}/><FileLinks files={content?.files}/></Panel>
  }
  if (slug === 'berita') return portal.news.length ? <NewsArchive portal={portal}/> : <Panel><p className="text-sm text-slate-500">Belum ada berita yang dipublikasikan.</p></Panel>
  if (slug === 'agenda-kegiatan') return <AgendaCalendar agendas={portal.agendas} websiteName={portal.website.name}/>
  if (slug === 'pengumuman') return portal.announcements.length ? <div className="space-y-4">{portal.announcements.map((item) => <Panel key={item.id}><p className="text-xs font-semibold text-teal-700">Terbit {new Date(item.publish_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</p><h2 className="mt-2 font-extrabold">{item.title}</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{plainContent(item.body)}</p>{item.attachment_path && <a href={item.attachment_path} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700"><FileText className="h-4 w-4"/>{item.attachment_name || 'Unduh lampiran'}<ArrowUpRight className="h-4 w-4"/></a>}</Panel>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada pengumuman aktif.</p></Panel>
  if (slug === 'inovasi') return portal.innovations.length ? <div className="grid gap-4 md:grid-cols-2">{portal.innovations.map((item) => <Panel key={item.id}>{item.cover_path && <img src={item.cover_path} alt="" className="mb-4 max-h-72 w-full rounded-xl object-cover" loading="lazy"/>}<h2 className="font-extrabold">{item.title}</h2>{item.launch_year && <p className="mt-1 text-xs font-bold text-teal-700">Tahun {item.launch_year}</p>}<p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{plainContent(item.description)}</p><div className="mt-4 flex flex-wrap gap-3">{item.application_url && <a href={item.application_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">Buka aplikasi <ArrowUpRight className="inline h-3.5 w-3.5"/></a>}{item.video_url && <a href={item.video_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">Lihat video <ArrowUpRight className="inline h-3.5 w-3.5"/></a>}</div></Panel>)}</div> : <Panel><p className="text-sm text-slate-500">Belum ada inovasi yang dipublikasikan.</p></Panel>
  if (slug === 'galeri-gambar' || slug === 'galeri-video') {
    const type = slug === 'galeri-gambar' ? 'image' : 'video'
    const albums = portal.albums.filter((album) => album.type === type)
    return <PublicGallery albums={albums} type={type} websiteName={portal.website.name} />
  }
  if (slug === 'kontak') return <ContactPage portal={portal}/>
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
  if (moduleSlug === 'ppid') {
    const documents = PUBLIC_DOCUMENT_MODULES
      .filter((entry) => portal.moduleVisibility?.[entry.slug] !== false)
      .flatMap((entry) => {
        const content = portal.contents[entry.slug]
        const savedDocuments = Array.isArray(content?.metadata?.public_documents) ? content.metadata.public_documents : []
        if (savedDocuments.length) return [...savedDocuments.map((document) => ({
          key: document.id,
          slug: entry.slug,
          category: entry.category,
          categoryLabel: entry.label,
          title: document.title || entry.label,
          description: plainContent(document.description || ''),
          moduleDescription: '',
          updatedAt: document.revision_month ? `${document.revision_month}-01T00:00:00.000Z` : document.updated_at || null,
          attachments: document.attachment ? [document.attachment] : [],
          externalUrl: null,
        })), ...(content?.metadata?.external_url ? [{
          key: `${entry.slug}-portal`,
          slug: entry.slug,
          category: entry.category,
          categoryLabel: entry.label,
          title: 'Portal Layanan Informasi Publik (PPID Utama Kota Bandung)',
          description: 'Portal PPID utama Kota Bandung untuk layanan dan informasi publik.',
          moduleDescription: '',
          updatedAt: content?.updated_at || null,
          attachments: [],
          externalUrl: content.metadata.external_url,
        }] : [])]
        if (!contentIsFilled(content) && !content?.metadata?.external_url) return []
        const moduleMeta = CONTENT_MODULES.find((item) => item.slug === entry.slug)
        return [{
          key: entry.slug,
          slug: entry.slug,
          category: entry.category,
          categoryLabel: entry.label,
          title: content?.title || moduleMeta?.title || entry.label,
          description: plainContent(content?.body || ''),
          moduleDescription: moduleMeta?.description || '',
          updatedAt: content?.updated_at || null,
          attachments: [...(Array.isArray(content?.files) ? content.files : []), ...(Array.isArray(content?.images) ? content.images : [])],
          externalUrl: content?.metadata?.external_url || null,
        }]
      })
    const ppidContent = portal.contents.ppid
    const ppidIntroduction = portal.moduleVisibility.ppid !== false && contentIsFilled(ppidContent) ? {
      title: ppidContent.title || 'Profil PPID Pelaksana',
      description: plainContent(ppidContent.body || ''),
      attachments: [...(Array.isArray(ppidContent.files) ? ppidContent.files : []), ...(Array.isArray(ppidContent.images) ? ppidContent.images : [])],
    } : null
    return <div className="public-portal min-h-screen bg-slate-50 text-slate-900" data-portal-template={portal.website.template_slug || 'kecamatan'}><PortalHeader website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility} announcements={portal.announcements}/><PublicPageHero image={portal.contents.ppid?.metadata?.page_hero_image?.url} eyebrow="Transparansi Publik" title="Dokumen Resmi & Informasi Publik" description={`Akses dan unduh dokumen kebijakan, laporan kinerja, informasi publik, serta layanan PPID ${portal.website.name}.`}/><OfficialDocumentsArchive subdomain={subdomain} documents={documents} ppidIntroduction={ppidIntroduction}/><PortalFooter website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/></div>
  }
  if (moduleSlug === 'profil') {
    return <div className="public-portal min-h-screen bg-slate-50 text-slate-900" data-portal-template={portal.website.template_slug || 'kecamatan'}><PortalHeader website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility} announcements={portal.announcements}/><PublicPageHero image={portal.contents.profil?.metadata?.page_hero_image?.url} eyebrow="Informasi Kewilayahan" title={`Profil ${portal.website.name}`} description={`Mengenal sejarah, letak geografis, demografi penduduk, dan tata kelola ${portal.website.name}.`} links={[
      { label: 'Gambaran Wilayah', href: '#gambaran-wilayah' },
      ...(portal.moduleVisibility?.profil !== false ? [{ label: 'Visi & Misi', href: '#visi-misi' }] : []),
      ...(portal.moduleVisibility?.['profil-pimpinan'] !== false ? [{ label: 'Profil Pimpinan', href: '#profil-pimpinan' }] : []),
      ...(portal.moduleVisibility?.['struktur-organisasi'] !== false ? [{ label: 'Struktur Organisasi', href: '#struktur-organisasi' }] : []),
    ]}/><ProfileRegionPage portal={portal} subdomain={subdomain}/><PortalFooter website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/></div>
  }
  if (moduleSlug === 'layanan') {
    const services = portal.services.map((service) => ({ ...service, description: plainContent(service.description || ''), requirements: plainContent(service.requirements || ''), procedure: plainContent(service.procedure || '') }))
    return <div className="public-portal min-h-screen bg-slate-50 text-slate-900" data-portal-template={portal.website.template_slug || 'kecamatan'}><PortalHeader website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility} announcements={portal.announcements}/><ServiceCatalog website={portal.website} services={services} heroImage={portal.contents.layanan?.metadata?.page_hero_image?.url}/><PortalFooter website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/></div>
  }
  const recordModules = ['layanan','berita','agenda-kegiatan','program-dan-kegiatan','pengumuman','inovasi','galeri-gambar','galeri-video','kontak','profil','struktur-organisasi', ...PUBLIC_DOCUMENT_MODULE_SLUGS]
  const genericContent = portal.contents[moduleSlug]
  return <div className="public-portal min-h-screen bg-slate-50 text-slate-900" data-portal-template={portal.website.template_slug || 'kecamatan'}><PortalHeader website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility} announcements={portal.announcements}/><PublicPageHero image={genericContent?.metadata?.page_hero_image?.url} eyebrow={moduleSlug === 'berita' ? 'Informasi Kewilayahan' : portalModule.title} title={moduleSlug === 'berita' ? 'Kabar & Publikasi Berita' : portalModule.title} description={moduleSlug === 'berita' ? `Pusat siaran berita resmi, pengumuman instansi, agenda kegiatan kewilayahan, serta dokumentasi kegiatan ${portal.website.name}.` : portalModule.description}/>{['agenda-kegiatan', 'kontak', 'program-dan-kegiatan', 'inovasi', ...PUBLIC_DOCUMENT_MODULE_SLUGS].includes(moduleSlug) ? <ModuleRecords slug={moduleSlug} portal={portal}/> : <main className="mx-auto w-full max-w-[1440px] space-y-7 px-5 py-8 sm:py-12 lg:px-10"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Link href={`/${subdomain}`} className="inline-flex items-center gap-2 text-xs font-bold text-teal-700"><ArrowLeft className="h-4 w-4"/>Kembali ke beranda</Link><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-700">{portal.website.name} · Arsip & Modul</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{portalModule.title}</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">{portalModule.description}</p></div><ModuleRecords slug={moduleSlug} portal={portal}/>{moduleSlug !== 'struktur-organisasi' && moduleSlug !== 'berita' && !PUBLIC_DOCUMENT_MODULE_SLUGS.includes(moduleSlug) && contentIsFilled(genericContent) && <ContentPanel module={portalModule} content={genericContent}/>}{!recordModules.includes(moduleSlug) && !contentIsFilled(genericContent) && <Panel><p className="text-sm text-slate-500">Belum ada konten yang dipublikasikan untuk modul ini.</p></Panel>}</main>}<PortalFooter website={portal.website} profile={portal.profile} moduleVisibility={portal.moduleVisibility}/></div>
}
