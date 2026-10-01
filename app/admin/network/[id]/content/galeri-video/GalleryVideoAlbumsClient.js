'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, FolderOpen, Search, Trash2, Video, X } from 'lucide-react'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import { createVideoAlbumAction, deleteVideoAlbumAction } from './actions'

const PER_PAGE = 8
function formatDate(value) { return value ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value)) : 'Tanggal belum ditentukan' }

export default function GalleryVideoAlbumsClient({ website, initialAlbums }) {
  const router = useRouter()
  const [albums, setAlbums] = useState(initialAlbums)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? albums.filter((album) => album.title?.toLowerCase().includes(term)) : albums
  }, [albums, search])
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function createAlbum(event) {
    event.preventDefault(); setLoading(true)
    try {
      const data = new FormData(); data.set('title', title); data.set('album_date', date)
      const result = await createVideoAlbumAction(website.id, data)
      if (result?.error) notify('error', result.error)
      else { setAlbums((current) => [result.album, ...current]); setTitle(''); setDate(''); setPage(1); notify('success', result.message); router.refresh() }
    } catch (error) { notify('error', error.message || 'Gagal membuat album video.') }
    finally { setLoading(false) }
  }

  async function deleteAlbum() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const result = await deleteVideoAlbumAction(website.id, pendingDelete.id)
      if (result?.error) notify('error', result.error)
      else { setAlbums((current) => current.filter((album) => album.id !== pendingDelete.id)); setPendingDelete(null); notify('success', result.message); router.refresh() }
    } catch (error) { notify('error', error.message || 'Gagal menghapus album.') }
    finally { setDeleting(false) }
  }

  return <div className="w-full space-y-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4" /></button></div>}
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Galeri Video</h1><p className="mt-1 text-sm text-slate-500">{website.name} <span className="px-1">—</span><Link href={`/${website.subdomain}`} target="_blank" className="text-blue-600 hover:underline">/{website.subdomain}</Link></p></div><Link href={`/admin/network/${website.id}/content`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Kembali</Link></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Buat Album Baru</h2><p className="mt-1 text-xs text-slate-500">Masukkan nama album video dan tanggal kegiatan untuk membuat album baru.</p></div><form onSubmit={createAlbum} className="grid grid-cols-1 gap-3 md:grid-cols-12"><div className="md:col-span-6"><label className="sr-only" htmlFor="video-album-title">Judul album</label><div className="relative"><Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input id="video-album-title" required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul album, misal: Kunjungan Kerja Maret 2026" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/25"/></div></div><div className="md:col-span-3"><label className="sr-only" htmlFor="video-album-date">Tanggal kegiatan</label><div className="relative"><CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input id="video-album-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/25"/></div></div><div className="md:col-span-3"><button type="submit" disabled={loading || !title.trim() || !date} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> : <span>＋</span>}{loading ? 'Membuat…' : 'Buat Album'}</button></div></form></section>
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-base font-bold text-slate-900">Daftar Album ({filtered.length})</h2><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari album…" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/25"/></div></div>
      <div className="space-y-3">{visible.length ? visible.map((album) => <article key={album.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-400"><Video className="h-6 w-6"/><span className="text-[10px] font-semibold">Video</span></div><div><h3 className="text-sm font-bold text-slate-800">{album.title}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(album.album_date)} <span className="px-1 text-slate-300">•</span> {album.item_count} item</p></div></div><div className="flex items-center justify-end gap-2"><Link href={`/admin/network/${website.id}/content/galeri-video/${album.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"><FolderOpen className="h-3.5 w-3.5"/>Kelola Isi</Link><button type="button" onClick={() => setPendingDelete(album)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/>Hapus</button></div></article>) : <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">{search ? 'Album tidak ditemukan.' : 'Belum ada album video. Buat album pertama di atas.'}</div>}</div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Menampilkan {filtered.length ? (page - 1) * PER_PAGE + 1 : 0} dari {filtered.length} album</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">‹ Sebelumnya</button><span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">Halaman {page} dari {pages}</span><button type="button" disabled={page >= pages} onClick={() => setPage((current) => Math.min(pages, current + 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Berikutnya ›</button></div></div>
    </section>
    <ConfirmModal isOpen={Boolean(pendingDelete)} onClose={() => !deleting && setPendingDelete(null)} onConfirm={deleteAlbum} title="Hapus album video?" message={`Album “${pendingDelete?.title || ''}” dan seluruh video di dalamnya akan dihapus permanen.`} confirmText="Hapus Album" cancelText="Batal" loading={deleting}/>
  </div>
}
