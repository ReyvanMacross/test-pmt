'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ArrowRight, BellRing, CalendarDays, ExternalLink, FileText, X } from 'lucide-react'

function formatDate(value) {
  if (!value) return 'Tanggal tidak tersedia'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak tersedia'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

const subscribeToNothing = () => () => {}
const getClientMounted = () => true
const getServerMounted = () => false

export default function OfficialAnnouncementPopup({ website, announcements = [], enabled = true }) {
  const [open, setOpen] = useState(false)
  const mounted = useSyncExternalStore(subscribeToNothing, getClientMounted, getServerMounted)
  const visibleAnnouncements = announcements.slice(0, 4)
  const allAnnouncementsHref = `/${website.subdomain}/pengumuman`

  useEffect(() => {
    if (!enabled || visibleAnnouncements.length === 0) return
    const key = `portal-announcements-seen:v2:${website.subdomain}`
    try {
      if (window.sessionStorage.getItem(key)) return
    } catch {
      // Keep the announcement available if browser storage is disabled.
    }
    const timer = window.setTimeout(() => setOpen(true), 0)
    return () => window.clearTimeout(timer)
  }, [enabled, visibleAnnouncements.length, website.subdomain])

  const closePopup = useCallback(() => {
    try {
      window.sessionStorage.setItem(`portal-announcements-seen:v2:${website.subdomain}`, '1')
    } catch {
      // Closing still works when browser storage is disabled.
    }
    setOpen(false)
  }, [website.subdomain])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closePopup()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, closePopup])

  if (!open || !mounted) return null

  return createPortal(<div data-portal-template={website.template_slug || 'kecamatan'} className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm sm:p-6" role="presentation">
    <button type="button" aria-label="Tutup pengumuman" onClick={closePopup} className="absolute inset-0 h-full w-full cursor-default"/>
    <section role="dialog" aria-modal="true" aria-labelledby="official-announcement-title" className="relative z-10 flex max-h-[min(86svh,52rem)] w-full max-w-2xl animate-[announcement-in_.22s_ease-out] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <header className="relative overflow-hidden bg-[#071923] px-5 py-6 text-white sm:px-8 sm:py-7">
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-teal-700/30 via-transparent to-transparent"/>
        <div className="relative flex items-start gap-4 pr-9">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-300/25 bg-teal-400/15 text-teal-200"><BellRing className="h-6 w-6"/></span>
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-200">Informasi resmi</span>
            <h2 id="official-announcement-title" className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">Pengumuman {website.name}</h2>
            <p className="mt-1 text-sm text-slate-300">Informasi penting terbaru untuk masyarakat.</p>
          </div>
        </div>
        <button type="button" onClick={closePopup} aria-label="Tutup" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4"/></button>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        {visibleAnnouncements.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold text-teal-700"><CalendarDays className="h-4 w-4 shrink-0"/>Terbit {formatDate(item.publish_date)}{item.expires_at && <span className="text-slate-400">· Berlaku sampai {formatDate(item.expires_at)}</span>}</p>
          <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">{item.title}</h3>
          {item.body && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.body}</p>}
          {item.attachment_path && <a href={item.attachment_path} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900"><FileText className="h-4 w-4"/>{item.attachment_name || 'Buka lampiran'}<ExternalLink className="h-3.5 w-3.5"/></a>}
        </article>)}
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end sm:p-5">
        <button type="button" onClick={closePopup} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Tutup</button>
        <Link href={allAnnouncementsHref} onClick={closePopup} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white transition hover:bg-teal-500">Semua pengumuman<ArrowRight className="h-4 w-4"/></Link>
      </footer>
    </section>
  </div>, document.body)
}
