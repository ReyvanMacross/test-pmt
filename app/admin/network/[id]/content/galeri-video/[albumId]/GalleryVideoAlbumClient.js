'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, ExternalLink, Link2, Trash2, Video, X } from 'lucide-react'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import { addVideoUrlAction, deleteVideoItemAction, updateVideoAlbumAction } from '../actions'

function dateInput(value) { return typeof value === 'string' ? value.slice(0, 10) : value ? new Date(value).toISOString().slice(0, 10) : '' }
function formatDate(value) { return value ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value)) : 'Tanggal tidak tersedia' }

export default function GalleryVideoAlbumClient({ website, initialAlbum, initialItems }) {
  const router = useRouter()
  const fileInput = useRef(null)
  const [album, setAlbum] = useState(initialAlbum)
  const [items, setItems] = useState(initialItems)
  const [title, setTitle] = useState(initialAlbum.title || '')
  const [date, setDate] = useState(dateInput(initialAlbum.album_date))
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState('')
  const previewRef = useRef('')
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }, [])
  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }
  function selectFile(nextFile) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = nextFile ? URL.createObjectURL(nextFile) : ''
    setPreview(previewRef.current)
    setFile(nextFile)
    if (nextFile) setUrl('')
    if (nextFile && !videoTitle) setVideoTitle(nextFile.name.replace(/\.[^.]+$/, '').slice(0, 255))
  }

  async function saveAlbum(event) {
    event.preventDefault(); setSaving(true)
    try {
      const data = new FormData(); data.set('title', title); data.set('album_date', date)
      const result = await updateVideoAlbumAction(website.id, album.id, data)
      if (result?.error) notify('error', result.error)
      else { setAlbum((current) => ({ ...current, title, album_date: date })); notify('success', result.message); router.refresh() }
    } catch (error) { notify('error', error.message || 'Gagal menyimpan album.') }
    finally { setSaving(false) }
  }

  async function addVideo(event) {
    event.preventDefault()
    if (!videoTitle.trim()) { notify('error', 'Judul video wajib diisi.'); return }
    setAdding(true)
    try {
      let result
      if (file) {
        const data = new FormData(); data.set('file', file); data.set('title', videoTitle); data.set('description', description)
        const response = await fetch(`/api/admin/network/${website.id}/gallery-video/albums/${album.id}/items`, { method: 'POST', body: data })
        result = await response.json()
        if (!response.ok && !result.error) result.error = 'Gagal mengunggah video.'
      } else if (url.trim()) {
        const data = new FormData(); data.set('url', url); data.set('title', videoTitle); data.set('description', description)
        result = await addVideoUrlAction(website.id, album.id, data)
      } else { notify('error', 'Pilih berkas video atau masukkan tautan video.'); return }
      if (result?.error) notify('error', result.error)
      else {
        setItems((current) => [result.item, ...current]); setVideoTitle(''); setDescription(''); setUrl(''); selectFile(null)
        if (fileInput.current) fileInput.current.value = ''
        notify('success', result.message || 'Video berhasil ditambahkan.'); router.refresh()
      }
    } catch (error) { notify('error', error.message || 'Gagal menambahkan video.') }
    finally { setAdding(false) }
  }

  async function deleteVideo() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const result = await deleteVideoItemAction(website.id, album.id, pendingDelete.id)
      if (result?.error) notify('error', result.error)
      else { setItems((current) => current.filter((item) => item.id !== pendingDelete.id)); setPendingDelete(null); notify('success', result.message); router.refresh() }
    } catch (error) { notify('error', error.message || 'Gagal menghapus video.') }
    finally { setDeleting(false) }
  }

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/25'
  return <div className="w-full space-y-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h1 className="text-2xl font-bold text-slate-900">{album.title}</h1><p className="mt-1 text-sm text-slate-500">{website.name} — Album Video</p></div><Link href={`/admin/network/${website.id}/content/galeri-video`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4"/>Kembali</Link></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Info Album</h2><p className="mt-1 text-xs text-slate-500">Perbarui nama dan tanggal kegiatan album video.</p></div><form onSubmit={saveAlbum} className="grid grid-cols-1 items-end gap-3 md:grid-cols-12"><div className="md:col-span-6"><label htmlFor="video-album-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Nama Album *</label><input id="video-album-name" className={inputClass} maxLength={255} required value={title} onChange={(event) => setTitle(event.target.value)}/></div><div className="md:col-span-4"><label htmlFor="video-album-date" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Tanggal Kegiatan *</label><div className="relative"><CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input id="video-album-date" className={`${inputClass} pl-9`} type="date" required value={date} onChange={(event) => setDate(event.target.value)}/></div></div><div className="md:col-span-2"><button disabled={saving || !title.trim() || !date} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> : '✓'}{saving ? 'Menyimpan…' : 'Simpan'}</button></div></form></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Tambah Video</h2><p className="mt-1 text-xs text-slate-500">Unggah berkas video langsung atau tautkan URL dari YouTube, TikTok, Instagram, atau X (Twitter).</p></div><form onSubmit={addVideo} className="space-y-4">
      <div><label className="mb-2 block text-sm font-semibold text-slate-700">Berkas Video Langsung</label><label htmlFor="gallery-video-file" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const candidate = event.dataTransfer.files?.[0]; if (candidate) { if (candidate.size > 100 * 1024 * 1024) notify('error', 'Ukuran video maksimal 100 MB.'); else if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(candidate.type)) notify('error', 'Format video harus MP4, MOV, atau WebM.'); else selectFile(candidate) } }} className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-6 text-center hover:border-blue-400 hover:bg-blue-50/20">{preview ? <video src={preview} controls className="mb-3 max-h-48 max-w-full rounded-lg"/> : <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Video className="h-5 w-5"/></span>}<span className="text-sm text-slate-600">{file ? file.name : <>Tarik video ke sini atau <span className="font-semibold text-blue-600 underline">Pilih dari Komputer</span></>}</span><span className="mt-1 text-xs text-slate-400">Format: MP4, MOV, WebM — maks 100 MB per video</span><input ref={fileInput} id="gallery-video-file" type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={(event) => { const candidate = event.target.files?.[0]; if (candidate) { if (candidate.size > 100 * 1024 * 1024) notify('error', 'Ukuran video maksimal 100 MB.'); else if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(candidate.type)) notify('error', 'Format video harus MP4, MOV, atau WebM.'); else selectFile(candidate) }; event.target.value = '' }}/></label>{file && <button type="button" onClick={() => selectFile(null)} className="mt-2 text-xs font-semibold text-rose-600">Batalkan pilihan berkas</button>}</div>
      <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200"/>Atau tautkan URL video<span className="h-px flex-1 bg-slate-200"/></div>
      <div><label htmlFor="video-url" className="mb-1.5 block text-xs font-semibold text-slate-700">URL Video (YouTube, TikTok, Instagram, X/Twitter)</label><div className="relative"><Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input id="video-url" type="url" disabled={Boolean(file)} value={url} onChange={(event) => { setUrl(event.target.value); if (event.target.value) selectFile(null) }} placeholder="https://youtube.com/watch?v=… atau https://tiktok.com/@…" className={`${inputClass} pl-9 disabled:bg-slate-50`}/></div><p className="mt-1 text-[10px] text-slate-400">Tautan didukung: YouTube, YouTube Shorts, TikTok, Instagram Reels, dan X (Twitter).</p></div>
      <div><label htmlFor="video-title" className="mb-1.5 block text-xs font-semibold text-slate-700">Judul Video / Keterangan *</label><input id="video-title" required maxLength={255} value={videoTitle} onChange={(event) => setVideoTitle(event.target.value)} placeholder="Contoh: Liputan Penataan Kabel Udara Jalan Veteran…" className={inputClass}/></div>
      <div><label htmlFor="video-description" className="mb-1.5 block text-xs font-semibold text-slate-700">Deskripsi Video (Opsional)</label><textarea id="video-description" maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tuliskan rincian narasi video, narasumber, atau catatan teknis dokumentasi…" className={`${inputClass} min-h-28 resize-y`}/></div>
      <div className="flex justify-end border-t border-slate-100 pt-4"><button type="submit" disabled={adding || !videoTitle.trim() || (!file && !url.trim())} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> : <span>＋</span>}{adding ? 'Menambahkan…' : 'Tambah Video'}</button></div>
    </form></section>
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><h2 className="text-base font-bold text-slate-900">Isi Album <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{items.length}</span></h2><p className="mt-1 text-xs text-slate-500">Total {items.length} item video terdaftar</p></div></div>{items.length ? <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200"><div className="flex aspect-video items-center justify-center bg-slate-950">{item.path.startsWith('http://') || item.path.startsWith('https://') ? <a href={item.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"><ExternalLink className="h-4 w-4"/>Buka video eksternal</a> : <video src={item.path} controls preload="metadata" className="h-full w-full"/>}</div><div className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-800">{item.name}</h3><p className="mt-1 text-xs text-slate-500">{item.path.startsWith('http') ? 'Tautan video' : 'Video terunggah'} <span className="px-1">•</span> {formatDate(item.created_at)}</p>{item.description && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{item.description}</p>}</div><button type="button" aria-label={`Hapus video ${item.name}`} onClick={() => setPendingDelete(item)} className="shrink-0 rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button></div></article>)}</div> : <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center"><span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-300"><Video className="h-5 w-5"/></span><p className="text-sm font-semibold text-slate-700">Belum ada item di album ini.</p><p className="mt-1 text-xs text-slate-400">Gunakan formulir di atas untuk mengunggah berkas video atau menautkan URL video kegiatan.</p></div>}</section>
    <ConfirmModal isOpen={Boolean(pendingDelete)} onClose={() => !deleting && setPendingDelete(null)} onConfirm={deleteVideo} title="Hapus video?" message={`Video “${pendingDelete?.name || ''}” akan dihapus dari album ini.`} confirmText="Hapus Video" cancelText="Batal" loading={deleting}/>
  </div>
}
