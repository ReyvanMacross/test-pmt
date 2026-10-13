'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ImagePlus, Info, LoaderCircle, RefreshCw, Upload, X } from 'lucide-react'
import { saveHeroSlidesAction } from './actions'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const colors = [
  ['teal', 'Teal (Default)'], ['emerald', 'Emerald'], ['amber', 'Amber'],
  ['blue', 'Biru'], ['indigo', 'Indigo'], ['rose', 'Rose'],
]
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
const slotTitle = ['Portal Resmi Wilayah', 'Program Inovasi Wilayah', 'Agenda & Partisipasi Publik']
const slotDescription = ['Banner utama pengenalan portal kecamatan', 'Banner program unggulan dan digitalisasi', 'Banner agenda dan keterbukaan informasi']

function formatBytes(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function resizeDescription(element) {
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

export default function HeroSliderManager({ websiteId, slides }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const [selectedImages, setSelectedImages] = useState({})
  const [dimensions, setDimensions] = useState({})
  const previewUrls = useRef({})

  useEffect(() => () => Object.values(previewUrls.current).forEach((url) => URL.revokeObjectURL(url)), [])
  useEffect(() => {
    const resizeDescriptions = () => document.querySelectorAll('[data-hero-description]').forEach(resizeDescription)
    resizeDescriptions()
    window.addEventListener('resize', resizeDescriptions)
    return () => window.removeEventListener('resize', resizeDescriptions)
  }, [])
  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  function handleImageChange(position, event) {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedImages((current) => ({ ...current, [position]: null }))
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      event.target.value = ''
      setNotice({ type: 'error', text: 'Ukuran gambar maksimal 2 MB.' })
      return
    }
    const oldPreview = previewUrls.current[position]
    if (oldPreview) URL.revokeObjectURL(oldPreview)
    setNotice(null)
    const preview = URL.createObjectURL(file)
    previewUrls.current[position] = preview
    setSelectedImages((current) => ({ ...current, [position]: { file, preview } }))
    const removeCheckbox = document.getElementById(`slide_${position}_remove_image`)
    if (removeCheckbox) removeCheckbox.checked = false
  }

  function resetImageChoice(position) {
    const input = document.getElementById(`slide_${position}_image`)
    const removeCheckbox = document.getElementById(`slide_${position}_remove_image`)
    if (input) input.value = ''
    if (removeCheckbox) removeCheckbox.checked = false
    const oldPreview = previewUrls.current[position]
    if (oldPreview) URL.revokeObjectURL(oldPreview)
    delete previewUrls.current[position]
    setSelectedImages((current) => ({ ...current, [position]: null }))
    setDimensions((current) => ({ ...current, [position]: null }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setLoading(true)
    setNotice(null)
    try {
      const result = await saveHeroSlidesAction(websiteId, new FormData(form))
      if (result?.error) setNotice({ type: 'error', text: result.error })
      else {
        setNotice({ type: 'success', text: result?.message || 'Hero Slider berhasil disimpan.' })
        Object.values(previewUrls.current).forEach((url) => URL.revokeObjectURL(url))
        previewUrls.current = {}
        form.querySelectorAll('input[type="file"]').forEach((input) => { input.value = '' })
        setSelectedImages({})
        router.refresh()
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Terjadi kesalahan saat menyimpan Hero Slider.' })
    } finally {
      setLoading(false)
    }
  }

  return <form onSubmit={handleSubmit} className="space-y-5">
    <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
      <div><p className="font-semibold">Sistem Fixed 3 Slots Slider</p><p className="mt-1 leading-relaxed text-blue-800">Template landing page dirancang secara presisi menggunakan 3 slide tetap. Anda dapat memperbarui judul, deskripsi, badge kategori, gambar, dan visibilitas slide tanpa merusak alur navigasi tombol utama.</p></div>
    </div>
    {notice && <div role={notice.type === 'error' ? 'alert' : 'status'} className={`fixed right-5 top-20 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${notice.type === 'error' ? 'border-rose-200 bg-white text-rose-700' : 'border-emerald-200 bg-white text-emerald-700'}`}><span className="flex-1">{notice.text}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setNotice(null)} className="shrink-0 rounded p-0.5 hover:bg-slate-100"><X className="h-4 w-4"/></button></div>}
    {slides.map((slide) => {
      const position = Number(slide.position)
      const prefix = `slide_${position}_`
      const selected = selectedImages[position]
      const preview = selected?.preview || slide.image_path
      return <details key={position} open={position === 1} onToggle={(event) => { if (event.currentTarget.open) { const slide = event.currentTarget; window.requestAnimationFrame(() => slide.querySelectorAll('[data-hero-description]').forEach(resizeDescription)) } }} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-slate-50 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">{position}</span><div className="min-w-0"><h2 className="font-bold text-slate-900">Slide {position} — {slotTitle[position - 1]}</h2><p className="text-xs text-slate-500">{slotDescription[position - 1]}</p></div></div>
          <div className="flex shrink-0 items-center gap-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${slide.is_active ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>{slide.is_active ? 'Aktif' : 'Draft'}</span><ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"/></div>
        </summary>
        <div className="space-y-5 border-t border-slate-200 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}badge_text`}>Badge Category Text</label><input id={`${prefix}badge_text`} name={`${prefix}badge_text`} maxLength={120} defaultValue={slide.badge_text || ''} placeholder="Contoh: PORTAL RESMI WILAYAH" className={inputClass}/></div>
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}badge_color`}>Tema Warna Badge</label><select id={`${prefix}badge_color`} name={`${prefix}badge_color`} defaultValue={slide.badge_color || 'teal'} className={inputClass}>{colors.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}visibility`}>Status Visibilitas</label><select id={`${prefix}visibility`} name={`${prefix}visibility`} defaultValue={slide.is_active ? 'active' : 'hidden'} className={inputClass}><option value="active">Tampilkan (Aktif)</option><option value="hidden">Sembunyikan (Draft)</option></select></div>
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}headline`}>Headline Utama (Judul Banner)</label><input id={`${prefix}headline`} name={`${prefix}headline`} maxLength={180} defaultValue={slide.headline || ''} placeholder="Masukkan judul banner utama" className={inputClass}/></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}description`}>Deskripsi Paragraf Singkat</label><textarea id={`${prefix}description`} name={`${prefix}description`} rows={1} maxLength={1200} defaultValue={slide.description || ''} placeholder="Tulis deskripsi singkat yang tampil di bawah judul." data-hero-description ref={resizeDescription} onInput={(event) => resizeDescription(event.currentTarget)} style={{ resize: 'none', overflow: 'hidden' }} className={`${inputClass} resize-none overflow-hidden leading-5`}/></div>
          <div className="border-t border-slate-100 pt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor={`${prefix}image`}>Gambar Latar Belakang Slide (Background Banner)</label>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.48fr)]">
              <div className="relative flex aspect-video min-h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {preview ? <img src={preview} alt={`Pratinjau gambar latar slide ${position}`} className="absolute inset-0 h-full w-full object-cover" onLoad={(event) => { const { naturalWidth, naturalHeight } = event.currentTarget; setDimensions((current) => ({ ...current, [position]: `${naturalWidth} × ${naturalHeight} px` })) }}/> : <div className="px-6 text-center text-sm text-slate-500"><ImagePlus className="mx-auto mb-2 h-7 w-7 text-slate-400"/><p>Belum ada gambar latar</p><p className="mt-1 text-xs">Unggah gambar banner untuk slide ini</p></div>}
                {preview && <span className="absolute bottom-3 left-3 rounded-lg bg-slate-950/85 px-2.5 py-1.5 text-xs font-semibold text-white">{dimensions[position] || (slide.image_path ? 'Gambar terpasang' : 'Pratinjau gambar baru')}</span>}
              </div>
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-800">Ketentuan Berkas</p><ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-500"><li>• Format: JPG, PNG, WebP</li><li>• Resolusi ideal: 1920 × 1080 px (16:9)</li><li>• Ukuran maksimal berkas: 2 MB</li></ul>
                  {selected && <p className="mt-3 break-all text-xs text-slate-600">{selected.file.name} · {formatBytes(selected.file.size)}</p>}
                  {slide.image_name && !selected && <p className="mt-3 break-all text-xs text-slate-600">Terpasang: {slide.image_name}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor={`${prefix}image`} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"><Upload className="h-4 w-4"/>Unggah Gambar Baru<input id={`${prefix}image`} name={`${prefix}image`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(position, event)} className="sr-only"/></label>
                  <button type="button" onClick={() => resetImageChoice(position)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"><RefreshCw className="h-4 w-4"/>Reset Pilihan Gambar</button>
                  {slide.image_path && <label className="flex cursor-pointer items-center justify-center gap-2 pt-1 text-xs font-medium text-rose-600"><input id={`slide_${position}_remove_image`} type="checkbox" name={`${prefix}remove_image`} className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"/>Hapus gambar yang terpasang</label>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>
    })}
    <div className="flex justify-end rounded-2xl border border-slate-200 bg-white p-4"><button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Menyimpan...</> : <><Check className="h-4 w-4"/>Simpan Hero Slider</>}</button></div>
  </form>
}
