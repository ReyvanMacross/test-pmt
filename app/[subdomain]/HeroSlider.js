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

export default function HeroSlider({ slides, website, base }) {
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

  return <section aria-label="Banner utama" className="relative isolate overflow-hidden bg-[#092b32] text-white">
    <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#092b32] via-[#0c514f] to-[#071923]"/>
    {activeSlide.image_path && <img key={activeSlide.image_path} src={activeSlide.image_path} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"/>}
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#052c31]/90 via-[#063b3b]/75 to-[#052c31]/60"/>
    <div className="mx-auto flex min-h-[390px] w-full max-w-[1440px] flex-col items-center justify-center px-5 py-16 text-center sm:min-h-[470px] lg:px-10">
      {activeSlide.badge_text && <span className={`inline-flex rounded-md border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] ${badgeStyles[activeSlide.badge_color] || badgeStyles.teal}`}>{activeSlide.badge_text}</span>}
      <h1 className="mt-6 max-w-4xl text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{activeSlide.headline || website.name}</h1>
      {activeSlide.description && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">{activeSlide.description}</p>}
      <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href={`${base}/layanan`} className="rounded-full bg-amber-400 px-5 py-3 text-xs font-extrabold text-slate-900 shadow-lg hover:bg-amber-300">Jelajahi Layanan Publik <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></Link><Link href={`${base}/profil`} className="rounded-full border border-white/30 px-5 py-3 text-xs font-bold text-white hover:bg-white/10">Profil Wilayah</Link></div>
      <p className="mt-10 text-[10px] font-bold uppercase tracking-[.16em] text-teal-200">{website.name} — Pemerintah Kota Bandung</p>
      {slides.length > 1 && <div className="mt-6 flex items-center gap-3"><button type="button" onClick={previous} aria-label="Slide sebelumnya" className="rounded-full border border-white/20 p-2 text-white/80 hover:bg-white/10"><ChevronLeft className="h-4 w-4"/></button><div className="flex items-center gap-1.5">{slides.map((slide, index) => <button key={slide.position} type="button" onClick={() => setActiveIndex(index)} aria-label={`Tampilkan slide ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-teal-300' : 'w-1.5 bg-white/40'}`}/>)}</div><button type="button" onClick={next} aria-label="Slide berikutnya" className="rounded-full border border-white/20 p-2 text-white/80 hover:bg-white/10"><ChevronRight className="h-4 w-4"/></button></div>}
    </div>
    <div className="absolute -bottom-px left-0 h-8 w-full bg-white [clip-path:polygon(0_0,50%_100%,100%_0,100%_100%,0_100%)]"/>
  </section>
}
