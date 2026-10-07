'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ArrowUpRight } from 'lucide-react'

export default function MobilePortalMenu({ website, links }) {
  const [open, setOpen] = useState(false)
  const base = `/${website.subdomain}`

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  return <div className="lg:hidden">
    <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu navigasi" aria-expanded={open} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10">
      <Menu className="h-5 w-5"/>
    </button>
    {open && typeof document !== 'undefined' && createPortal(<div className="fixed inset-0 z-[1000] text-white">
      <button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="fixed inset-0 bg-slate-950/70"/>
      <aside aria-label="Navigasi portal" className="fixed inset-y-0 right-0 z-10 flex w-[min(88vw,22rem)] flex-col border-l border-white/10 p-5 text-white shadow-2xl" style={{ backgroundColor: '#071923', opacity: 1 }}>
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-5">
          <Link href={base} onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
            <Image src="/images/logo_bdg_putih.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain"/>
            <span className="min-w-0"><strong className="block truncate text-sm font-extrabold uppercase">{website.name}</strong><span className="mt-0.5 block text-xs text-slate-300">Portal resmi wilayah</span></span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5"/></button>
        </div>
        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain py-5">
          {links.map(([label, href], index) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-teal-400/40 hover:bg-white/5 hover:text-teal-200"><span className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-xs font-bold text-teal-200">{String(index + 1).padStart(2, '0')}</span>{label}</span><ArrowUpRight className="h-4 w-4 text-slate-400"/></Link>)}
        </nav>
        <Link href={`${base}/kontak`} onClick={() => setOpen(false)} className="mt-3 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-500">Portal Warga <ArrowUpRight className="h-4 w-4"/></Link>
      </aside>
    </div>, document.body)}
  </div>
}
