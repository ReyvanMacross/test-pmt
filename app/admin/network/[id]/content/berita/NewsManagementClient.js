'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Newspaper, Plus, Search, Trash2, Pencil, X } from 'lucide-react'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import { createNewsLinkAction, deleteNewsLinkAction } from './actions'

const PER_PAGE = 8

function hostFromUrl(value) {
  try { return new URL(value).hostname } catch { return value || 'Sumber berita' }
}

function shortDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}

export default function NewsManagementClient({ website, initialNews }) {
  const router = useRouter()
  const [news, setNews] = useState(initialNews)
  const [url, setUrl] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function notify(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? news.filter((item) => [item.title, item.url, item.author, item.source_domain].some((value) => value?.toLowerCase().includes(term))) : news
  }, [news, search])
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const items = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function addNews(event) {
    event.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('url', url.trim())
      const result = await createNewsLinkAction(website.id, formData)
      if (result?.error) notify('error', result.error)
      else {
        setUrl('')
        if (result.newsItem) setNews((current) => [result.newsItem, ...current])
        notify('success', result.message || 'Link berita berhasil ditambahkan.')
        router.refresh()
      }
    } catch (error) {
      notify('error', error.message || 'Terjadi kesalahan saat menambahkan berita.')
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (!deleteItem) return
    setDeleteLoading(true)
    try {
      const result = await deleteNewsLinkAction(website.id, deleteItem.id)
      if (result?.error) notify('error', result.error)
      else {
        setNews((current) => current.filter((item) => item.id !== deleteItem.id))
        notify('success', result.message || 'Link berita berhasil dihapus.')
        setDeleteItem(null)
        router.refresh()
      }
    } catch (error) {
      notify('error', error.message || 'Terjadi kesalahan saat menghapus berita.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><span className="font-semibold">{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</span><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4" /></button></div>}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Berita</h1>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <span>{website.name}</span><span>—</span>
            <Link className="inline-flex items-center gap-1 text-blue-600 hover:underline" href={`/${website.subdomain}`} target="_blank">/{website.subdomain}<ExternalLink className="h-3 w-3" /></Link>
          </p>
        </div>
        <Link href={`/admin/network/${website.id}/content`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Kembali</Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Tambah Link Berita</h2>
          <p className="mt-1 text-xs text-slate-500">Tempel link berita. Judul, gambar, penulis, dan ringkasan akan dicoba diambil otomatis dari halaman tersebut.</p>
        </div>
        <form onSubmit={addNews} className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="news-url">URL berita</label>
          <input id="news-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://contoh.go.id/berita/..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Plus className="h-4 w-4" />}{loading ? 'Mengambil data…' : 'Tambah Berita'}</button>
        </form>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-slate-900">Daftar Berita ({filtered.length})</h2>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari berita…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs text-slate-800 shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
        </div>

        <div className="space-y-3">
          {items.length ? items.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">{item.image ? <Image src={item.image} alt="" fill unoptimized sizes="80px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><Newspaper className="h-7 w-7" /></div>}</div>
                <div className="min-w-0"><h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{item.title || item.url}</h3><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><a href={item.url} target="_blank" rel="noreferrer" className="max-w-[240px] truncate font-medium text-blue-600 hover:underline">{item.source_domain || hostFromUrl(item.url)}</a><span className="text-slate-300">|</span><span>Diperbarui: {shortDate(item.updated_at)}</span></div></div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2">
                <Link href={`/admin/network/${website.id}/content/berita/${item.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" />Edit</Link>
                <button type="button" onClick={() => setDeleteItem(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
              </div>
            </article>
          )) : <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500"><Newspaper className="h-8 w-8 text-slate-300" />{search ? 'Berita tidak ditemukan.' : 'Belum ada link berita. Tambahkan URL berita di atas.'}</div>}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Menampilkan {filtered.length ? (page - 1) * PER_PAGE + 1 : 0}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} berita</span>
          <div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">‹ Sebelumnya</button><span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">Halaman {page} dari {pages}</span><button type="button" disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Berikutnya ›</button></div>
        </div>
      </section>

      <ConfirmModal isOpen={Boolean(deleteItem)} onClose={() => !deleteLoading && setDeleteItem(null)} onConfirm={confirmDelete} title="Hapus link berita?" message={`Link “${deleteItem?.title || deleteItem?.url || ''}” akan dihapus dari website ini.`} confirmText="Hapus Berita" cancelText="Batal" type="danger" loading={deleteLoading} />
    </div>
  )
}
