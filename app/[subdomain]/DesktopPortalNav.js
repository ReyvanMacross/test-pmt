'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

function isCurrent(pathname, href, base) {
  if (href === base) return pathname === base
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function DesktopPortalNav({ base, links, infoLinks }) {
  const pathname = usePathname()
  const homeHref = base
  const homeCurrent = isCurrent(pathname, homeHref, base)
  const infoCurrent = infoLinks.some(({ href }) => isCurrent(pathname, href, base))
  const linkClass = (current) => `relative whitespace-nowrap py-2 text-xs font-bold transition ${current ? 'text-teal-300 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-teal-400' : 'text-slate-200 hover:text-teal-300'}`

  return <nav aria-label="Navigasi utama" className="hidden items-center gap-5 xl:flex">
    <Link href={homeHref} aria-current={homeCurrent ? 'page' : undefined} className={linkClass(homeCurrent)}>Beranda</Link>
    {links.filter(({ label }) => ['Layanan Publik', 'Profil Wilayah'].includes(label)).map((item) => {
      const current = isCurrent(pathname, item.href, base)
      return <Link key={item.href} href={item.href} aria-current={current ? 'page' : undefined} className={linkClass(current)}>{item.label}</Link>
    })}
    {infoLinks.length > 0 && <details key={pathname} className="group relative py-3">
      <summary aria-current={infoCurrent ? 'page' : undefined} className={`relative flex cursor-pointer list-none items-center gap-1 whitespace-nowrap py-2 text-xs font-bold transition ${infoCurrent ? 'text-teal-300 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-teal-400' : 'text-slate-200 hover:text-teal-300'}`}>Kabar & Informasi<ChevronDown className="h-4 w-4 transition group-open:rotate-180"/></summary>
      <div className="absolute left-0 top-full z-50 min-w-56 overflow-hidden rounded-xl border border-white/15 bg-[#06141D] py-1 shadow-2xl">
        {infoLinks.map((item) => <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href, base) ? 'page' : undefined} className="block px-4 py-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-teal-300">{item.label}</Link>)}
      </div>
    </details>}
    {links.filter(({ label }) => ['Dokumen Resmi', 'Kontak'].includes(label)).map((item) => {
      const current = isCurrent(pathname, item.href, base)
      return <Link key={item.href} href={item.href} aria-current={current ? 'page' : undefined} className={linkClass(current)}>{item.label}</Link>
    })}
  </nav>
}
