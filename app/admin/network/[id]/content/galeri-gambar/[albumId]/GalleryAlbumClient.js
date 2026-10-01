'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Camera, ImagePlus, Trash2, UploadCloud, X } from 'lucide-react'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import { deleteGalleryItemAction, updateGalleryAlbumAction, uploadGalleryItemAction } from '../actions'

function dateInput(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  return new Date(value).toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return 'Tanggal tidak tersedia'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}

export default function GalleryAlbumClient({ website, initialAlbum, initialItems }) {
  const router = useRouter()
  const [album, setAlbum] = useState(initialAlbum)
  const [items, setItems] = useState(initialItems)
  const [title, setTitle] = useState(initialAlbum.title || '')
  const [albumDate, setAlbumDate] = useState(dateInput(initialAlbum.album_date))
  const [file, setFile] = useState(null)
  const [photoTitle, setPhotoTitle] = useState('')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState('')
  const previewUrlRef = useRef('')
  const [savingAlbum, setSavingAlbum] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  function setSelectedFile(nextFile) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = nextFile ? URL.createObjectURL(nextFile) : ''
    setPreview(previewUrlRef.current)
    setFile(nextFile)
  }

  function notify(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function saveAlbum(event) {
    event.preventDefault()
    setSavingAlbum(true)
    try {
      const data = new FormData()
      data.set('title', title)
      data.set('album_date', albumDate)
      const result = await updateGalleryAlbumAction(website.id, album.id, data)
      if (result?.error) notify('error', result.error)
      else {
        setAlbum((current) => ({ ...current, title, album_date: albumDate }))
        notify('success', result.message || 'Informasi album tersimpan.')
        router.refresh()
      }
    } catch (error) { notify('error', error.message || 'Gagal menyimpan informasi album.') }
    finally { setSavingAlbum(false) }
  }

  async function uploadPhoto(event) {
    event.preventDefault()
    if (!file) { notify('error', 'Pilih berkas foto terlebih dahulu.'); return }
    setUploading(true)
    try {
      const data = new FormData()
      data.set('file', file)
      data.set('title', photoTitle)
      data.set('description', description)
      const result = await uploadGalleryItemAction(website.id, album.id, data)
      if (result?.error) notify('error', result.error)
      else {
        setItems((current) => [result.item, ...current])
        setSelectedFile(null)
        setPhotoTitle('')
        setDescription('')
        notify('success', result.message || 'Foto berhasil diunggah.')
        router.refresh()
      }
    } catch (error) { notify('error', error.message || 'Gagal mengunggah foto.') }
    finally { setUploading(false) }
  }

  async function deletePhoto() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const result = await deleteGalleryItemAction(website.id, album.id, pendingDelete.id)
      if (result?.error) notify('error', result.error)
      else {
        setItems((current) => current.filter((item) => item.id !== pendingDelete.id))
        setPendingDelete(null)
        notify('success', result.message || 'Foto berhasil dihapus.')
        router.refresh()
      }
    } catch (error) { notify('error', error.message || 'Gagal menghapus foto.') }
    finally { setDeleting(false) }
  }

  function chooseFile(candidate) {
    if (!candidate) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(candidate.type)) {
      notify('error', 'Format foto harus JPG, PNG, atau WebP.')
      return
    }
    if (candidate.size > 2 * 1024 * 1024) {
      notify('error', 'Ukuran foto maksimal 2 MB.')
      return
    }
    setSelectedFile(candidate)
    if (!photoTitle) setPhotoTitle(candidate.name.replace(/\.[^.]+$/, '').slice(0, 255))
  }

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/25'

  return (
    <div className="w-full space-y-6">
      {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4" /></button></div>}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">{album.title}</h1><p className="mt-1 text-sm text-slate-500">{website.name} <span className="px-1">—</span> Album Gambar</p></div>
        <Link href={`/admin/network/${website.id}/content/galeri-gambar`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Kembali</Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Info Album</h2><p className="mt-1 text-xs text-slate-500">Perbarui nama dan tanggal kegiatan album foto.</p></div>
        <form onSubmit={saveAlbum} className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
          <div className="md:col-span-6"><label htmlFor="gallery-album-name" className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Album <span className="text-rose-500">*</span></label><input id="gallery-album-name" className={inputClass} maxLength={255} required value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <div className="md:col-span-4"><label htmlFor="gallery-album-date" className="mb-1.5 block text-xs font-semibold text-slate-600">Tanggal Kegiatan <span className="text-rose-500">*</span></label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="gallery-album-date" className={`${inputClass} pl-9`} type="date" required value={albumDate} onChange={(event) => setAlbumDate(event.target.value)} /></div></div>
          <div className="md:col-span-2"><button disabled={savingAlbum || !title.trim() || !albumDate} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{savingAlbum ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}{savingAlbum ? 'Menyimpan…' : 'Simpan'}</button></div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Tambah Foto</h2><p className="mt-1 text-xs text-slate-500">Unggah foto beserta judul dan deskripsi dokumentasi.</p></div>
        <form onSubmit={uploadPhoto} className="space-y-4">
          <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Berkas Gambar <span className="text-rose-500">*</span></label><label htmlFor="gallery-photo-file" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]) }} className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50/40">{preview ? <div className="relative mb-3 h-28 w-full max-w-xs overflow-hidden rounded-lg"><Image src={preview} alt="Pratinjau foto" fill unoptimized sizes="320px" className="object-contain" /></div> : <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600"><UploadCloud className="h-5 w-5" /></span>}<span className="text-sm text-slate-600">{file ? file.name : <>Tarik foto ke sini atau <span className="font-semibold text-blue-600 underline">Pilih dari Komputer</span></>}</span><span className="mt-1 text-xs text-slate-400">Format: JPG, PNG, WebP — Maks 2 MB per foto</span><input id="gallery-photo-file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = '' }} /></label>{file && <button type="button" onClick={() => setSelectedFile(null)} className="mt-2 text-xs font-semibold text-rose-600 hover:underline">Batalkan pilihan foto</button>}</div>
          <div><label htmlFor="gallery-photo-title" className="mb-1.5 block text-xs font-semibold text-slate-600">Judul Foto / Keterangan <span className="text-rose-500">*</span></label><input id="gallery-photo-title" className={inputClass} maxLength={255} required value={photoTitle} onChange={(event) => setPhotoTitle(event.target.value)} placeholder="Contoh: Kunjungan Tim Diskominfo ke Kantor Kecamatan…" /></div>
          <div><label htmlFor="gallery-photo-description" className="mb-1.5 block text-xs font-semibold text-slate-600">Deskripsi Foto (Opsional)</label><textarea id="gallery-photo-description" className={`${inputClass} min-h-28 resize-y`} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tuliskan keterangan detail, narasumber yang hadir, atau catatan teknis dokumentasi…" /></div>
          <div className="flex justify-end border-t border-slate-100 pt-4"><button type="submit" disabled={uploading || !file || !photoTitle.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ImagePlus className="h-4 w-4" />}{uploading ? 'Mengunggah…' : 'Unggah Foto'}</button></div>
        </form>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Isi Album ({items.length})</h2><p className="mt-1 text-xs text-slate-500">Daftar foto yang telah diunggah ke dalam album ini.</p></div>
        {items.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="relative aspect-[4/3] bg-slate-100"><Image src={item.path} alt={item.name || ''} fill unoptimized sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /></div><div className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-800">{item.name}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>{item.description && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{item.description}</p>}</div><button type="button" aria-label={`Hapus foto ${item.name}`} onClick={() => setPendingDelete(item)} className="shrink-0 rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></article>)}</div> : <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center"><span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-300"><Camera className="h-5 w-5" /></span><p className="text-sm font-semibold text-slate-700">Belum ada item di album ini.</p><p className="mt-1 text-xs text-slate-400">Gunakan formulir di atas untuk mengunggah dokumentasi foto pertama.</p></div>}
      </section>

      <ConfirmModal isOpen={Boolean(pendingDelete)} onClose={() => !deleting && setPendingDelete(null)} onConfirm={deletePhoto} title="Hapus foto?" message={`Foto “${pendingDelete?.name || ''}” akan dihapus dari album ini.`} confirmText="Hapus Foto" cancelText="Batal" loading={deleting} />
    </div>
  )
}
