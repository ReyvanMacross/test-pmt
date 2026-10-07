import Link from 'next/link'
import { MapPin, Phone, Share2 } from 'lucide-react'
import MobilePortalMenu from './MobilePortalMenu'

export function PortalHeader({ website }) {
  const base = `/${website.subdomain}`
  const links = [
    ['Layanan Publik', `${base}/layanan`],
    ['Profil Wilayah', `${base}/profil`],
    ['Kabar Berita', `${base}/berita`],
    ['Dokumen Resmi', `${base}/ppid`],
    ['Kontak', `${base}/kontak`],
  ]
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071923]/95 text-white backdrop-blur-xl">
    <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-5 px-5 lg:px-10">
      <Link href={base} className="flex min-w-0 items-center gap-3" aria-label={`Beranda ${website.name}`}>
        <img src="/images/logo_bdg_putih.png" alt="Logo Kota Bandung" className="h-9 w-9 object-contain" />
        <span className="min-w-0"><strong className="block truncate text-xs font-extrabold uppercase tracking-wide sm:text-sm">{website.name}</strong><span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-slate-300">Pemerintah Kota Bandung</span></span>
      </Link>
      <nav className="hidden items-center gap-5 lg:flex">{links.map(([label, href]) => <Link key={href} href={href} className="text-xs font-semibold text-slate-200 transition hover:text-teal-300">{label}</Link>)}</nav>
      <div className="hidden lg:block"><Link href={`${base}/kontak`} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-500"><MapPin className="h-3.5 w-3.5"/> Portal Warga</Link></div>
      <MobilePortalMenu website={website} links={links}/>
    </div>
  </header>
}

export function PortalFooter({ website, profile }) {
  const base = `/${website.subdomain}`
  return <footer className="bg-[#071923] text-white">
    <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-10 md:grid-cols-[1.3fr_1fr] lg:px-10">
      <div className="flex items-start gap-4"><img src="/images/logo_bdg_putih.png" alt="Logo Kota Bandung" className="h-11 w-11 object-contain"/><div><h2 className="text-sm font-extrabold uppercase">{website.name}</h2><p className="mt-1 text-xs text-slate-400">Pemerintah Kota Bandung · Jawa Barat</p></div></div>
      <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
        {profile?.contact_address && <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-teal-300"/>{profile.contact_address}</p>}
        {profile?.office_phone && <p className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-teal-300"/>{profile.office_phone}</p>}
        {profile?.instagram_username && <a className="flex gap-2 hover:text-teal-300" href={`https://instagram.com/${profile.instagram_username.replace(/^@/, '')}`}><Share2 className="h-4 w-4 text-teal-300"/>Instagram · {profile.instagram_username}</a>}
        {profile?.facebook_page_name && <p className="flex gap-2"><Share2 className="h-4 w-4 text-teal-300"/>Facebook · {profile.facebook_page_name}</p>}
        {profile?.youtube_channel_url && <a className="flex gap-2 hover:text-teal-300" href={profile.youtube_channel_url} target="_blank" rel="noreferrer"><Share2 className="h-4 w-4 text-teal-300"/>Kanal YouTube</a>}
      </div>
    </div>
    <div className="border-t border-white/10"><div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-5 py-4 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-10"><span>© {new Date().getFullYear()} {website.name} — Pemerintah Kota Bandung. Hak Cipta Dilindungi Undang-Undang.</span><Link href={base} className="font-semibold text-teal-300">Portal Multi-Tenant Diskominfo</Link></div></div>
  </footer>
}
