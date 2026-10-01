'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, FolderOpen, Plus, Search, Trash2, X } from 'lucide-react'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import { createGalleryAlbumAction, deleteGalleryAlbumAction } from './actions'

const PER_PAGE = 8

function formatDate(value) {
  if (!value) return 'Tanggal belum ditentukan'
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

export default function GalleryAlbumsClient({ website, initialAlbums }) {
  const router = useRouter()
  const [albums, setAlbums] = useState(initialAlbums)
  const [title, setTitle] = useState('')
  const [albumDate, setAlbumDate] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function notify(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const filteredAlbums = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? albums.filter((album) => album.title?.toLowerCase().includes(term)) : albums
  }, [albums, search])
  const pageCount = Math.max(1, Math.ceil(filteredAlbums.length / PER_PAGE))
  const visibleAlbums = filteredAlbums.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function createAlbum(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('title', title)
      formData.set('album_date', albumDate)
      const result = await createGalleryAlbumAction(website.id, formData)
      if (result?.error) notify('error', result.error)
      else {
        setAlbums((current) => [result.album, ...current])
        setTitle('')
        setAlbumDate('')
        setPage(1)
        notify('success', result.message || 'Album berhasil dibuat.')
        router.refresh()
      }
    } catch (error) {
      notify('error', error.message || 'Terjadi kesalahan saat membuat album.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteAlbum() {
    if (!pendingDelete) return
    setDeleteLoading(true)
    try {
      const result = await deleteGalleryAlbumAction(website.id, pendingDelete.id)
      if (result?.error) notify('error', result.error)
      else {
        setAlbums((current) => current.filter((album) => album.id !== pendingDelete.id))
        setPendingDelete(null)
        notify('success', result.message || 'Album berhasil dihapus.')
        router.refresh()
      }
    } catch (error) {
      notify('error', error.message || 'Terjadi kesalahan saat menghapus album.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4" /></button></div>}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Galeri Gambar</h1><p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500"><span>{website.name}</span><span>—</span><Link href={`/${website.subdomain}`} target="_blank" className="text-blue-600 hover:underline">/{website.subdomain}</Link></p></div>
        <Link href={`/admin/network/${website.id}/content`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Kembali</Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Buat Album Baru</h2><p className="mt-1 text-xs text-slate-500">Masukkan nama album foto dan tanggal kegiatan untuk membuat album galeri baru.</p></div>
        <form onSubmit={createAlbum} className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-7"><label htmlFor="album-title" className="sr-only">Judul album</label><input id="album-title" required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul album, misal: Kunjungan Kerja Maret 2026" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30" /></div>
          <div className="md:col-span-3"><label htmlFor="album-date" className="sr-only">Tanggal album</label><input id="album-date" type="date" required value={albumDate} onChange={(event) => setAlbumDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30" /></div>
          <div className="md:col-span-2"><button type="submit" disabled={loading || !title.trim() || !albumDate} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Plus className="h-4 w-4" />}{loading ? 'Membuat…' : 'Buat Album'}</button></div>
        </form>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-base font-bold text-slate-900">Daftar Album ({filteredAlbums.length})</h2><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari album…" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30" /></div></div>
        <div className="space-y-3">
          {visibleAlbums.length ? visibleAlbums.map((album) => (
            <article key={album.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4"><div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-slate-400">{album.cover_path ? <Image src={album.cover_path} alt="" fill unoptimized sizes="80px" className="object-cover" /> : <div className="flex flex-col items-center gap-1"><Camera className="h-6 w-6" /><span className="text-[10px] font-semibold">Kosong</span></div>}</div><div className="min-w-0"><h3 className="truncate text-sm font-bold text-slate-800">{album.title}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(album.album_date)} <span className="px-1 text-slate-300">•</span> {album.item_count} foto</p></div></div>
              <div className="flex shrink-0 items-center justify-end gap-2"><Link href={`/admin/network/${website.id}/content/galeri-gambar/${album.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"><FolderOpen className="h-3.5 w-3.5" />Kelola Isi</Link><button type="button" onClick={() => setPendingDelete(album)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Hapus</button></div>
            </article>
          )) : <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">{search ? 'Album tidak ditemukan.' : 'Belum ada album gambar. Buat album pertama di atas.'}</div>}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Menampilkan {filteredAlbums.length ? (page - 1) * PER_PAGE + 1 : 0} dari {filteredAlbums.length} album</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">‹ Sebelumnya</button><span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">Halaman {page} dari {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Berikutnya ›</button></div></div>
      </section>
      <ConfirmModal isOpen={Boolean(pendingDelete)} onClose={() => !deleteLoading && setPendingDelete(null)} onConfirm={deleteAlbum} title="Hapus album gambar?" message={`Album “${pendingDelete?.title || ''}” dan seluruh foto di dalamnya akan dihapus permanen.`} confirmText="Hapus Album" cancelText="Batal" type="danger" loading={deleteLoading} />
    </div>
  )
}
