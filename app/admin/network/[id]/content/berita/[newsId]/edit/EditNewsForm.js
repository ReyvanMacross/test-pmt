'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Save, X } from 'lucide-react'
import { updateNewsLinkAction } from '../../actions'

export default function EditNewsForm({ website, news }) {
  const router = useRouter()
  const [form, setForm] = useState({
    url: news.url || '',
    title: news.title || '',
    author: news.author || '',
    image: news.image || '',
    excerpt: news.excerpt || '',
    autoFetch: false,
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function notify(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('url', form.url)
      formData.set('title', form.title)
      formData.set('author', form.author)
      formData.set('image', form.image)
      formData.set('excerpt', form.excerpt)
      formData.set('auto_fetch', String(form.autoFetch))
      const result = await updateNewsLinkAction(website.id, news.id, formData)
      if (result?.error) notify('error', result.error)
      else {
        notify('success', result?.message || 'Perubahan berita berhasil disimpan.')
        router.refresh()
      }
    } catch (error) {
      notify('error', error.message || 'Terjadi kesalahan saat menyimpan berita.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4" /></button></div>}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Link Berita</h1><p className="mt-1 text-sm text-slate-500">{website.name} — <Link href={`/${website.subdomain}`} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:underline">/{website.subdomain}<ExternalLink className="h-3 w-3" /></Link></p></div>
        <Link href={`/admin/network/${website.id}/content/berita`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Kembali</Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Informasi Link Berita</h2><p className="mt-1 text-xs text-slate-500">Sesuaikan tautan, judul, thumbnail gambar, dan ringkasan konten berita.</p></div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label htmlFor="news-url" className="mb-2 block text-sm font-semibold text-slate-700">URL Berita <span className="text-rose-500">*</span></label><input id="news-url" type="url" required value={form.url} onChange={(event) => update('url', event.target.value)} placeholder="https://diskominfo.bandung.go.id/berita/..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div><label htmlFor="news-title" className="mb-2 block text-sm font-semibold text-slate-700">Judul Berita <span className="text-rose-500">*</span></label><input id="news-title" required maxLength={500} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Masukkan judul berita..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div><label htmlFor="news-author" className="mb-2 block text-sm font-semibold text-slate-700">Penulis / Author</label><input id="news-author" maxLength={255} value={form.author} onChange={(event) => update('author', event.target.value)} placeholder="Nama penulis atau sumber redaksi (misal: Humas Diskominfo / Tim Redaksi)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div><label htmlFor="news-image" className="mb-2 block text-sm font-semibold text-slate-700">URL Gambar / Thumbnail</label><input id="news-image" type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />{form.image && <div className="relative mt-3 h-36 max-w-xs overflow-hidden rounded-lg border border-slate-200"><Image src={form.image} alt="Pratinjau thumbnail berita" fill unoptimized sizes="320px" className="object-cover" /></div>}</div>
          <div><label htmlFor="news-excerpt" className="mb-2 block text-sm font-semibold text-slate-700">Ringkasan Berita</label><textarea id="news-excerpt" rows={5} maxLength={5000} value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} placeholder="Ketikkan ringkasan berita di sini..." className="w-full resize-y rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={form.autoFetch} onChange={(event) => update('autoFetch', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />Ambil ulang judul/gambar/ringkasan otomatis dari URL di atas</label>
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row"><Link href={`/admin/network/${website.id}/content/berita`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Batal</Link><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Save className="h-4 w-4" />}{loading ? 'Menyimpan…' : 'Simpan Berita'}</button></div>
        </form>
      </section>
    </div>
  )
}
