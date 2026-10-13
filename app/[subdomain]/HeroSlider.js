'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

const badgeStyles = {
  teal: 'border-teal-200/30 bg-teal-400/15 text-teal-100',
  emerald: 'border-emerald-200/30 bg-emerald-400/15 text-emerald-100',
  amber: 'border-amber-200/30 bg-amber-400/15 text-amber-100',
  blue: 'border-blue-200/30 bg-blue-400/15 text-blue-100',
  indigo: 'border-indigo-200/30 bg-indigo-400/15 text-indigo-100',
  rose: 'border-rose-200/30 bg-rose-400/15 text-rose-100',
}

export default function HeroSlider({ slides, website, base, moduleVisibility = {} }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeSlide = slides[activeIndex]

  useEffect(() => {
    if (slides.length < 2) return undefined
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 6500)
    return () => window.clearInterval(timer)
  }, [slides.length])

  if (!activeSlide) return null
  const next = () => setActiveIndex((index) => (index + 1) % slides.length)
  const previous = () => setActiveIndex((index) => (index - 1 + slides.length) % slides.length)
  const visiblePath = (slug) => moduleVisibility[slug] === false ? `${base}#arsip` : `${base}/${slug}`
  const variants = [
    { primary: ['layanan', 'Jelajahi Layanan Publik'], secondary: ['profil', 'Profil Wilayah'] },
    { primary: ['berita', 'Lihat Kabar Wilayah'], secondary: ['layanan', 'Layanan Publik'] },
    { primary: ['ppid', 'Dokumen Resmi'], secondary: ['kontak', 'Kanal Pengaduan'] },
  ]
  const variant = variants[Math.max(0, Math.min(variants.length - 1, Number(activeSlide.position || activeIndex + 1) - 1))]
  const primaryHref = visiblePath(variant.primary[0])
  const secondaryHref = visiblePath(variant.secondary[0])

  return <section aria-label="Banner utama" className="relative isolate overflow-hidden bg-[#092b32] text-white">
    <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#092b32] via-[#0c514f] to-[#071923]"/>
    {activeSlide.image_path && <img key={activeSlide.image_path} src={activeSlide.image_path} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"/>}
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#052c31]/90 via-[#063b3b]/75 to-[#052c31]/60"/>
    <div className="mx-auto flex min-h-[470px] w-full max-w-[1440px] flex-col items-center justify-center px-5 pb-16 pt-14 text-center sm:min-h-[560px] sm:px-8 sm:pb-20 sm:pt-16 lg:px-10">
      {activeSlide.badge_text && <span className={`inline-flex rounded-md border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] ${badgeStyles[activeSlide.badge_color] || badgeStyles.teal}`}>{activeSlide.badge_text}</span>}
      <h1 aria-live="polite" className="mt-5 max-w-4xl break-words text-3xl font-black uppercase leading-[1.08] tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl">{activeSlide.headline || website.name}</h1>
      {activeSlide.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:mt-5 sm:text-base">{activeSlide.description}</p>}
      <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-7 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"><Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-extrabold text-slate-900 shadow-lg transition hover:bg-amber-300">{variant.primary[1]} <ArrowRight className="h-4 w-4"/></Link><Link href={secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">{variant.secondary[1]}</Link></div>
      <p className="mt-10 text-[10px] font-bold uppercase tracking-[.16em] text-teal-200">{website.name} — Pemerintah Kota Bandung</p>
      {slides.length > 1 && <div className="mt-6 flex items-center gap-3"><button type="button" onClick={previous} aria-label="Slide sebelumnya" className="rounded-full border border-white/20 p-2 text-white/80 hover:bg-white/10"><ChevronLeft className="h-4 w-4"/></button><div className="flex items-center gap-1.5">{slides.map((slide, index) => <button key={slide.position} type="button" onClick={() => setActiveIndex(index)} aria-label={`Tampilkan slide ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-teal-300' : 'w-1.5 bg-white/40'}`}/>)}</div><button type="button" onClick={next} aria-label="Slide berikutnya" className="rounded-full border border-white/20 p-2 text-white/80 hover:bg-white/10"><ChevronRight className="h-4 w-4"/></button></div>}
    </div>
    <div aria-hidden="true" className="absolute -bottom-px left-0 h-7 w-full bg-white [clip-path:polygon(0_0,50%_100%,100%_0,100%_100%,0_100%)] sm:h-9"/>
  </section>
}
