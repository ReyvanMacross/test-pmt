'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ImagePlus, Info, LoaderCircle, RefreshCw, Upload, X } from 'lucide-react'
import { saveModuleHeroImageAction } from '../actions'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const inputClass = 'sr-only'

export default function HeroPageManager({ websiteId, pages }) {
  const router = useRouter()
  const [selected, setSelected] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(null)
  const previews = useRef({})
  useEffect(() => () => Object.values(previews.current).forEach((url) => URL.revokeObjectURL(url)), [])

  function chooseImage(slug, event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE) {
      event.target.value = ''
      setNotice({ type: 'error', text: 'Ukuran gambar maksimal 5 MB.' })
      return
    }
    if (previews.current[slug]) URL.revokeObjectURL(previews.current[slug])
    const preview = URL.createObjectURL(file)
    previews.current[slug] = preview
    setSelected((current) => ({ ...current, [slug]: { file, preview } }))
    setNotice(null)
  }

  function resetImage(slug) {
    document.getElementById(`hero-page-${slug}-file`).value = ''
    if (previews.current[slug]) URL.revokeObjectURL(previews.current[slug])
    delete previews.current[slug]
    setSelected((current) => ({ ...current, [slug]: null }))
  }

  async function savePage(page, remove = false) {
    const form = document.getElementById(`hero-page-${page.slug}-form`)
    const formData = new FormData()
    const file = selected[page.slug]?.file
    if (file && !remove) formData.set('page_hero_file', file)
    if (remove) formData.set('remove_page_hero', 'true')
    setSaving(page.slug)
    setNotice(null)
    try {
      const result = await saveModuleHeroImageAction(websiteId, page.slug, formData)
      if (result?.error) setNotice({ type: 'error', text: `${page.title}: ${result.error}` })
      else {
        setNotice({ type: 'success', text: `${page.title}: ${result.message}` })
        resetImage(page.slug)
        form?.reset()
        router.refresh()
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Gagal menyimpan gambar header.' })
    } finally { setSaving(null) }
  }

  return <div className="space-y-5">
    <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900"><Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"/><div><p className="font-semibold">Pengaturan gambar header terpusat</p><p className="mt-1 leading-relaxed text-blue-800">Pilih halaman untuk mengganti gambar header. Beranda tetap dikelola melalui Hero Slider. Format JPG, PNG, atau WebP, maksimal 5 MB per gambar.</p></div></div>
    {notice && <div role={notice.type === 'error' ? 'alert' : 'status'} className={`fixed right-5 top-20 z-[100] flex max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-xl ${notice.type === 'error' ? 'border-rose-200 text-rose-700' : 'border-emerald-200 text-emerald-700'}`}><span className="flex-1">{notice.text}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setNotice(null)} className="shrink-0 rounded p-0.5 hover:bg-slate-100"><X className="h-4 w-4"/></button></div>}
    {pages.map((page, index) => {
      const activeSelection = selected[page.slug]
      const preview = activeSelection?.preview || page.image?.url || page.image?.path
      return <details key={page.slug} open={index === 0} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-slate-50 px-5 py-4 [&::-webkit-details-marker]:hidden"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">{index + 1}</span><div className="min-w-0"><h2 className="font-bold text-slate-900">{page.title}</h2><p className="text-xs text-slate-500">{page.description}</p></div></div><div className="flex shrink-0 items-center gap-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${page.image?.url || page.image?.path ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>{page.image?.url || page.image?.path ? 'Gambar terpasang' : 'Belum ada gambar'}</span><ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"/></div></summary>
        <form id={`hero-page-${page.slug}-form`} onSubmit={(event) => { event.preventDefault(); savePage(page) }} className="space-y-4 border-t border-slate-200 p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,.48fr)]">
            <div className="relative flex aspect-video min-h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">{preview ? <img src={preview} alt={`Pratinjau header ${page.title}`} className="absolute inset-0 h-full w-full object-cover"/> : <div className="px-6 text-center text-sm text-slate-500"><ImagePlus className="mx-auto mb-2 h-7 w-7 text-slate-400"/><p>Belum ada gambar header</p><p className="mt-1 text-xs">Pilih gambar untuk pratinjau</p></div>}</div>
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-800">Gambar halaman</p><ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-500"><li>• Format: JPG, PNG, WebP</li><li>• Disarankan: 1920 × 700 px</li><li>• Ukuran maksimal: 5 MB</li></ul>{activeSelection && <p className="mt-3 break-all text-xs text-slate-600">{activeSelection.file.name}</p>}</div><div className="flex flex-col gap-2"><label htmlFor={`hero-page-${page.slug}-file`} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"><Upload className="h-4 w-4"/>Pilih Gambar<input id={`hero-page-${page.slug}-file`} className={inputClass} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(page.slug, event)}/></label><button type="button" onClick={() => resetImage(page.slug)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"><RefreshCw className="h-4 w-4"/>Reset pilihan</button>{page.image?.url && <button type="button" onClick={() => savePage(page, true)} disabled={saving !== null} className="text-xs font-semibold text-rose-600 disabled:opacity-50">Hapus gambar terpasang</button>}</div></div>
          </div>
          <div className="flex justify-end"><button type="submit" disabled={!activeSelection?.file || saving !== null} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{saving === page.slug ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Menyimpan…</> : <><Check className="h-4 w-4"/>Simpan Gambar {page.title}</>}</button></div>
        </form>
      </details>
    })}
  </div>
}
