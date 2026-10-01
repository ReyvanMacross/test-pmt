'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileImage, Save, Send, Trash2, Upload, X } from 'lucide-react'
import { createInnovationAction, updateInnovationAction } from './actions'

function formatSize(size) { return size ? `${(size / 1024 / 1024).toFixed(1)} MB` : '' }

export default function InnovationForm({ website, initialInnovation = null, onCreated }) {
  const router = useRouter()
  const inputRef = useRef(null)
  const previewRef = useRef('')
  const [title, setTitle] = useState(initialInnovation?.title || '')
  const [description, setDescription] = useState(initialInnovation?.description || '')
  const [year, setYear] = useState(initialInnovation?.launch_year ? String(initialInnovation.launch_year) : '')
  const [applicationUrl, setApplicationUrl] = useState(initialInnovation?.application_url || '')
  const [videoUrl, setVideoUrl] = useState(initialInnovation?.video_url || '')
  const [cover, setCover] = useState(null)
  const [preview, setPreview] = useState('')
  const [removeCover, setRemoveCover] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const isEdit = Boolean(initialInnovation)
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }, [])
  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }
  function selectCover(file) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = file ? URL.createObjectURL(file) : ''
    setPreview(previewRef.current)
    setCover(file)
    if (file) setRemoveCover(false)
  }

  async function submit(event) {
    event.preventDefault(); setLoading(true)
    try {
      const data = new FormData()
      data.set('title', title); data.set('description', description); data.set('launch_year', year)
      data.set('application_url', applicationUrl); data.set('video_url', videoUrl); data.set('remove_cover', String(removeCover))
      if (cover) data.set('cover', cover)
      const result = isEdit ? await updateInnovationAction(website.id, initialInnovation.id, data) : await createInnovationAction(website.id, data)
      if (result?.error) notify('error', result.error)
      else {
        notify('success', result.message || 'Data inovasi berhasil disimpan.')
        if (!isEdit && result.innovation) onCreated?.(result.innovation)
        router.refresh()
        if (isEdit) setTimeout(() => router.push(`/admin/network/${website.id}/content/inovasi`), 700)
        else { setTitle(''); setDescription(''); setYear(''); setApplicationUrl(''); setVideoUrl(''); selectCover(null); if (inputRef.current) inputRef.current.value = '' }
      }
    } catch (error) { notify('error', error.message || 'Gagal menyimpan data inovasi.') }
    finally { setLoading(false) }
  }

  return <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
    <div className="space-y-1 border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Data Inovasi' : 'Tambah Inovasi Baru'}</h2><p className="text-sm text-slate-500">{isEdit ? 'Perbarui data program atau produk inovasi pelayanan publik instansi.' : 'Buat data program atau produk inovasi pelayanan publik instansi.'}</p></div>
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><label htmlFor="innovation-title" className="block text-sm font-semibold text-slate-800">Nama / Judul Inovasi</label><input id="innovation-title" required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Misal: IKHLAS (Inovasi Khusus Layanan Lansia)" className={inputClass}/></div>
      <div className="space-y-2"><label htmlFor="innovation-description" className="block text-sm font-semibold text-slate-800">Ringkasan &amp; Detail Inovasi</label><textarea id="innovation-description" required maxLength={50000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tuliskan deskripsi dan latar belakang inovasi…" className={`${inputClass} resize-y`}/></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="space-y-2"><label htmlFor="launch-year" className="block text-sm font-semibold text-slate-800">Tahun Peluncuran</label><input id="launch-year" type="number" min="1990" max="2099" value={year} onChange={(event) => setYear(event.target.value)} placeholder="2024" className={inputClass}/></div><div className="space-y-2"><label htmlFor="app-link" className="block text-sm font-semibold text-slate-800">Link Aplikasi / Website <span className="text-xs font-normal text-slate-400">(Opsional)</span></label><input id="app-link" type="url" value={applicationUrl} onChange={(event) => setApplicationUrl(event.target.value)} placeholder="https://…" className={inputClass}/></div><div className="space-y-2"><label htmlFor="video-link" className="block text-sm font-semibold text-slate-800">Link Video YouTube / Profil <span className="text-xs font-normal text-slate-400">(Opsional)</span></label><input id="video-link" type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtube.com/watch?v=…" className={inputClass}/></div></div>
      <div className="space-y-2"><label className="block text-sm font-semibold text-slate-800">Unggah Gambar Cover / Banner Inovasi <span className="text-xs font-normal text-slate-400">(Opsional)</span></label>
        {initialInnovation?.cover_path && !removeCover && !cover && <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3.5"><div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white"> <Image src={initialInnovation.cover_path} alt="Cover inovasi" fill unoptimized sizes="64px" className="object-cover"/></div><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{initialInnovation.cover_name}</p><p className="text-xs font-medium text-emerald-600">{formatSize(Number(initialInnovation.cover_size))} • Terunggah</p></div></div><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ganti Gambar</button><button type="button" title="Hapus gambar" onClick={() => setRemoveCover(true)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4"/></button></div></div>}
        {(!initialInnovation?.cover_path || removeCover || cover) && <label htmlFor="innovation-cover" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const selected = event.dataTransfer.files?.[0]; if (selected) acceptCover(selected, selectCover, notify) }} className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center hover:border-blue-400 hover:bg-blue-50/30">{preview ? <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-lg"><Image src={preview} alt="Pratinjau cover inovasi" fill unoptimized sizes="320px" className="object-contain"/></div> : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600"><FileImage className="h-5 w-5"/></span>}<span className="text-sm font-medium text-slate-700">{cover?.name || 'Unggah Gambar Cover / Banner'}</span><span className="text-xs text-slate-400">Format JPG, PNG, WebP, GIF — Maks. 5 MB</span><input ref={inputRef} id="innovation-cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) acceptCover(selected, selectCover, notify); event.target.value = '' }}/></label>}
        {removeCover && !cover && <button type="button" onClick={() => setRemoveCover(false)} className="text-xs font-semibold text-blue-700 hover:underline">Batalkan penghapusan gambar</button>}{cover && <button type="button" onClick={() => selectCover(null)} className="text-xs font-semibold text-rose-600 hover:underline">Batalkan pilihan gambar</button>}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Link href={`/admin/network/${website.id}/content/inovasi`} className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</Link><button type="submit" disabled={loading || !title.trim() || !description.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> : isEdit ? <Save className="h-4 w-4"/> : <Send className="h-4 w-4"/>}{loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Terbitkan Inovasi'}</button></div>
    </form>
  </section>
}

function acceptCover(file, selectCover, notify) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { notify('error', 'Cover harus berupa gambar JPG, PNG, WebP, atau GIF.'); return }
  if (file.size > 5 * 1024 * 1024) { notify('error', 'Ukuran gambar cover maksimal 5 MB.'); return }
  selectCover(file)
}
