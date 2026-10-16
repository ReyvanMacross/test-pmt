'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowUpRight, ChevronDown } from 'lucide-react'

export default function MobilePortalMenu({ website, links, infoLinks = [], showContact = true }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const base = `/${website.subdomain}`
  const isCurrent = (href) => href === base ? pathname === base : pathname === href || pathname.startsWith(`${href}/`)
  const infoCurrent = infoLinks.some(({ href }) => isCurrent(href))

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  return <div className="flex shrink-0 items-center gap-2 xl:hidden">
    {showContact && <Link href={`${base}/kontak`} aria-label="Portal Warga" title="Portal Warga" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm transition hover:bg-teal-500 sm:h-11 sm:w-11"><Image src="/images/portal-warga.svg" alt="" width={18} height={18}/></Link>}
    <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu navigasi" aria-expanded={open} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white transition hover:bg-white/10 sm:h-11 sm:w-11">
      <Menu className="h-5 w-5"/>
    </button>
    {open && typeof document !== 'undefined' && createPortal(<div className="fixed inset-0 z-[1000] text-white" data-portal-template={website.template_slug || 'kecamatan'}>
      <button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="fixed inset-0 bg-slate-950/70"/>
      <aside aria-label="Navigasi portal" className="fixed inset-y-0 right-0 z-10 flex w-[min(88vw,22rem)] flex-col border-l border-white/10 p-5 text-white shadow-2xl" style={{ backgroundColor: 'var(--portal-dark, #06141D)', opacity: 1 }}>
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-5">
          <Link href={base} onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
            <Image src="/images/logo_bdg_putih.png" alt="" width={32} height={40} className="h-9 w-7 shrink-0 object-contain"/>
            <span aria-hidden="true" className="h-8 w-px shrink-0 bg-white/20"/>
            <Image src="/images/logo_jawa_barat_putih.png" alt="" width={40} height={40} className="h-9 w-8 shrink-0 object-contain"/>
            <span className="min-w-0"><strong className="block truncate text-sm font-extrabold uppercase">{website.name}</strong><span className="mt-0.5 block text-xs text-slate-300">Portal resmi wilayah</span></span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5"/></button>
        </div>
        <nav aria-label="Menu portal" className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain py-5">
          {links.map(({ label, href }, index) => <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-teal-400/40 hover:bg-white/5 hover:text-teal-200"><span className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-xs font-bold text-teal-200">{String(index + 1).padStart(2, '0')}</span><span className="truncate">{label}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400"/></Link>)}
          {infoLinks.length > 0 && <details className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <summary aria-current={infoCurrent ? 'page' : undefined} className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-slate-100">Kabar & Informasi<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180"/></summary>
            <div className="space-y-1 border-t border-white/10 p-2">
              {infoLinks.map(({ label, href }) => <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-teal-200">{label}<ArrowUpRight className="h-4 w-4"/></Link>)}
            </div>
          </details>}
        </nav>
      </aside>
    </div>, document.body)}
  </div>
}
