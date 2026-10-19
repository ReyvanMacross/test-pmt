'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, X, XCircle } from 'lucide-react'
import { saveModuleHeroImageAction } from './actions'

export default function PageHeroImageSettings({ website, moduleSlug, moduleTitle, initialImage }) {
  const router = useRouter()
  const [file, setFile] = useState(null)
  const [image, setImage] = useState(initialImage || null)
  const [removeImage, setRemoveImage] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  function notify(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setToast(null)
    const data = new FormData()
    if (file) data.set('page_hero_file', file)
    if (removeImage) data.set('remove_page_hero', 'true')
    try {
      const result = await saveModuleHeroImageAction(website.id, moduleSlug, data)
      if (result?.error) notify('error', result.error)
      else {
        setImage(result.image)
        setFile(null)
        setRemoveImage(false)
        notify('success', result.message)
        router.refresh()
      }
    } catch (error) {
      notify('error', error.message || 'Gagal menyimpan gambar header.')
    } finally {
      setBusy(false)
    }
  }

  return <>
  {toast && <div role="status" aria-live="polite" className={`fixed right-5 top-5 z-[120] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><span className="mt-0.5">{toast.type === 'success' ? <CheckCircle2 className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}</span><span className="flex-1">{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
  <form onSubmit={save} className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-sm font-bold text-slate-900">Gambar Header Halaman {moduleTitle}</h2><p className="mt-1 text-xs text-slate-500">Gambar khusus halaman ini. Beranda tetap memakai Hero Slider.</p></div>{image?.url && !removeImage && <img src={image.url} alt={`Header ${moduleTitle}`} className="h-20 w-36 rounded-lg object-cover"/>}</div>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setFile(event.target.files?.[0] || null); setRemoveImage(false) }} className="block min-w-0 flex-1 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700"/><button type="submit" disabled={busy || (!file && !removeImage)} className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Menyimpan…' : 'Simpan Gambar'}</button>{image?.url && !removeImage && <button type="button" onClick={() => { setFile(null); setRemoveImage(true) }} className="text-xs font-semibold text-rose-600">Hapus gambar</button>}</div>
    <p className="mt-2 text-[11px] text-slate-500">JPG, PNG, WebP · maksimal 5 MB{file ? ` · ${file.name}` : ''}</p>
  </form>
  </>
}
