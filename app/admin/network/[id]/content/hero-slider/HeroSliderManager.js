'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ImagePlus, LoaderCircle, Upload } from 'lucide-react'
import { saveHeroSlidesAction } from './actions'

const colors = [
  ['teal', 'Teal (Default)'], ['emerald', 'Emerald'], ['amber', 'Amber'],
  ['blue', 'Biru'], ['indigo', 'Indigo'], ['rose', 'Rose'],
]
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
const colorsPreview = { teal: 'bg-teal-500', emerald: 'bg-emerald-500', amber: 'bg-amber-400', blue: 'bg-blue-500', indigo: 'bg-indigo-500', rose: 'bg-rose-500' }
const slotTitle = ['Portal Resmi Wilayah', 'Program Inovasi Wilayah', 'Agenda & Partisipasi Publik']
const slotDescription = ['Banner utama pengenalan portal wilayah', 'Banner program unggulan dan digitalisasi', 'Banner agenda dan keterbukaan informasi']

export default function HeroSliderManager({ websiteId, slides }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setNotice(null)
    try {
      const result = await saveHeroSlidesAction(websiteId, new FormData(event.currentTarget))
      if (result?.error) setNotice({ type: 'error', text: result.error })
      else {
        setNotice({ type: 'success', text: result?.message || 'Hero Slider berhasil disimpan.' })
        router.refresh()
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Terjadi kesalahan saat menyimpan Hero Slider.' })
    } finally {
      setLoading(false)
    }
  }

  return <form onSubmit={handleSubmit} className="space-y-5">
    {notice && <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{notice.text}</div>}
    {slides.map((slide) => {
      const prefix = `slide_${slide.position}_`
      return <details key={slide.position} open={slide.position === 1} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-slate-50 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">{slide.position}</span><div><h2 className="font-bold text-slate-900">Slide {slide.position} — {slotTitle[slide.position - 1]}</h2><p className="text-xs text-slate-500">{slotDescription[slide.position - 1]}</p></div></div>
          <div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${slide.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{slide.is_active ? 'Aktif' : 'Draft'}</span><ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"/></div>
        </summary>
        <div className="space-y-5 border-t border-slate-200 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}badge_text`}>Badge Category Text</label><input id={`${prefix}badge_text`} name={`${prefix}badge_text`} maxLength={120} defaultValue={slide.badge_text || ''} placeholder="Contoh: PORTAL RESMI WILAYAH" className={inputClass}/></div>
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}badge_color`}>Tema Warna Badge</label><select id={`${prefix}badge_color`} name={`${prefix}badge_color`} defaultValue={slide.badge_color || 'teal'} className={inputClass}>{colors.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}visibility`}>Status Visibilitas</label><select id={`${prefix}visibility`} name={`${prefix}visibility`} defaultValue={slide.is_active ? 'active' : 'hidden'} className={inputClass}><option value="active">Tampilkan (Aktif)</option><option value="hidden">Sembunyikan (Draft)</option></select></div>
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}headline`}>Headline Utama (Judul Banner)</label><input id={`${prefix}headline`} name={`${prefix}headline`} maxLength={180} defaultValue={slide.headline || ''} placeholder="Masukkan judul banner utama" className={inputClass}/></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}description`}>Deskripsi Paragraf Singkat</label><textarea id={`${prefix}description`} name={`${prefix}description`} rows={3} maxLength={1200} defaultValue={slide.description || ''} placeholder="Tulis deskripsi singkat yang tampil di bawah judul." className={inputClass}/></div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}image`}>Gambar Latar Slide <span className="font-normal text-slate-400">(Opsional, maks. 5 MB)</span></label><label htmlFor={`${prefix}image`} className="flex min-h-28 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 hover:border-blue-400 hover:bg-blue-50/40"><Upload className="h-5 w-5 text-blue-600"/><span>Pilih gambar JPG, PNG, WebP, atau GIF</span><input id={`${prefix}image`} name={`${prefix}image`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"/></label>{slide.image_name && <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><ImagePlus className="h-3.5 w-3.5"/>{slide.image_name}<label className="ml-auto inline-flex items-center gap-1.5 text-rose-600"><input type="checkbox" name={`${prefix}remove_image`} className="rounded border-slate-300"/> Hapus gambar</label></p>}</div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">{slide.image_path ? <img src={slide.image_path} alt={`Pratinjau slide ${slide.position}`} className="h-full min-h-28 w-full object-cover"/> : <div className="flex min-h-28 items-center justify-center text-xs text-slate-400">Belum ada gambar latar</div>}</div>
          </div>
        </div>
      </details>
    })}
    <div className="flex justify-end rounded-2xl border border-slate-200 bg-white p-4"><button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Menyimpan...</> : <><Check className="h-4 w-4"/>Simpan Hero Slider</>}</button></div>
  </form>
}
