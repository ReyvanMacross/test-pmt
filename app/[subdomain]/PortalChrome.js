import Link from 'next/link'
import { Mail, MapPin } from 'lucide-react'
import MobilePortalMenu from './MobilePortalMenu'
import DesktopPortalNav from './DesktopPortalNav'

export function PortalHeader({ website, moduleVisibility = {} }) {
  const base = `/${website.subdomain}`
  const isEnabled = (slug) => moduleVisibility[slug] !== false
  const links = [
    { label: 'Layanan Publik', href: `${base}/layanan`, enabled: isEnabled('layanan') },
    { label: 'Profil Wilayah', href: `${base}/profil`, enabled: isEnabled('profil') },
    { label: 'Kabar Berita', href: `${base}/berita`, enabled: isEnabled('berita') },
    { label: 'Agenda Kegiatan', href: `${base}/agenda-kegiatan`, enabled: isEnabled('agenda-kegiatan') },
    { label: 'Program dan Kegiatan', href: `${base}/program-dan-kegiatan`, enabled: isEnabled('program-dan-kegiatan') },
    { label: 'Inovasi Wilayah', href: `${base}/inovasi`, enabled: isEnabled('inovasi') },
    { label: 'Galeri Foto', href: `${base}/galeri-gambar`, enabled: isEnabled('galeri-gambar') },
    { label: 'Galeri Video', href: `${base}/galeri-video`, enabled: isEnabled('galeri-video') },
    { label: 'Dokumen Resmi', href: `${base}/ppid`, enabled: isEnabled('ppid') },
    { label: 'Kontak', href: `${base}/kontak`, enabled: isEnabled('kontak') },
  ].filter((item) => item.enabled)
  const quickLinks = links.filter((item) => ['Beranda', 'Layanan Publik', 'Profil Wilayah', 'Kabar Berita', 'Dokumen Resmi', 'Kontak'].includes(item.label))
  const infoLinks = links.filter((item) => ['Kabar Berita', 'Agenda Kegiatan', 'Program dan Kegiatan', 'Inovasi Wilayah', 'Galeri Foto', 'Galeri Video'].includes(item.label))
  const mobileLinks = [{ label: 'Beranda', href: base }, ...quickLinks.filter((item) => !['Beranda', 'Kabar Berita'].includes(item.label))]
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071923]/95 text-white backdrop-blur-xl">
    <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-5 px-5 lg:px-10">
      <Link href={base} className="flex min-w-0 items-center gap-3" aria-label={`Beranda ${website.name}`}>
        <img src="/images/logo_bdg_putih.png" alt="Logo BDG" className="hidden h-8 w-8 shrink-0 object-contain sm:block sm:h-9 sm:w-9" />
        <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-white/20 sm:block" />
        <img src="/images/logo_jawa_barat_putih.png" alt="Lambang Jawa Barat" className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9" />
        <span aria-hidden="true" className="mx-0.5 hidden h-8 w-px shrink-0 bg-white/20 sm:block" />
        <span className="min-w-0"><strong className="block truncate text-[11px] font-extrabold uppercase tracking-wide sm:text-sm">{website.name}</strong><span className="block truncate text-[9px] font-semibold uppercase tracking-[.12em] text-slate-300 sm:text-[10px]">Pemerintah Kota Bandung</span></span>
      </Link>
      <DesktopPortalNav base={base} links={links} infoLinks={infoLinks}/>
      {moduleVisibility.kontak !== false && <div className="hidden xl:block"><Link href={`${base}/kontak`} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-500"><img src="/images/portal-warga.svg" alt="" className="h-4 w-4"/>Portal Warga</Link></div>}
      <MobilePortalMenu website={website} links={mobileLinks} infoLinks={infoLinks} showContact={moduleVisibility.kontak !== false}/>
    </div>
  </header>
}

export function PortalFooter({ website, profile, moduleVisibility = {} }) {
  const base = `/${website.subdomain}`
  return <footer className="bg-[#06141D] text-white">
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-6 pt-10 sm:px-7 sm:pb-7 sm:pt-12 lg:px-10">
      <div className="flex flex-col gap-7 pb-8 md:flex-row md:items-center md:justify-between md:gap-8 md:pb-10">
        <Link href={base} className="flex min-w-0 items-center gap-3" aria-label={`Beranda ${website.name}`}>
          <img src="/images/logo_bdg_putih.png" alt="Logo BDG" className="h-9 w-8 shrink-0 object-contain"/>
          <span aria-hidden="true" className="h-9 w-px shrink-0 bg-white/20"/>
          <img src="/images/logo_jawa_barat_putih.png" alt="Lambang Jawa Barat" className="h-9 w-9 shrink-0 object-contain"/>
          <span aria-hidden="true" className="mx-1 h-9 w-px shrink-0 bg-white/20"/>
          <span className="min-w-0"><strong className="block truncate text-xs font-extrabold uppercase tracking-wide sm:text-sm">{website.name}</strong><span className="mt-1 block text-xs text-slate-300">Pemerintah Kota Bandung · Jawa Barat</span></span>
        </Link>
        <div className="flex flex-col gap-4 pl-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-4 md:justify-end">
          <a href="tel:112" className="flex min-w-0 items-center gap-3 rounded-xl sm:rounded-none">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-900/70 text-xs font-black text-teal-300">112</span>
            <span><strong className="block text-xs font-bold text-white">Bandung Siaga 112</strong><span className="mt-0.5 block text-xs text-slate-400">Call Center Bebas Pulsa (24 Jam)</span></span>
          </a>
          {moduleVisibility.kontak !== false && profile?.official_email && <a href={`mailto:${profile.official_email}`} className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-teal-300"><Mail className="h-4 w-4"/></span>
            <span className="min-w-0"><strong className="block text-xs font-bold text-white">Email Resmi</strong><span className="mt-0.5 block break-all text-xs font-semibold text-teal-300">{profile.official_email}</span></span>
          </a>}
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-white/10 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:pt-7">
        <p className="leading-relaxed">© {new Date().getFullYear()} {website.name} — Pemerintah Kota Bandung. Hak Cipta Dilindungi Undang-Undang.</p>
        <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-lg border border-teal-700/70 bg-teal-950/50 px-3 py-2 text-xs font-bold text-teal-300">
          <img src="/images/logo_diskominfo.png" alt="Logo Diskominfo" className="h-6 w-6 shrink-0 object-contain"/>
          <span>Powered by Multisite Diskominfo Kota Bandung</span>
        </div>
      </div>
    </div>
  </footer>
}
