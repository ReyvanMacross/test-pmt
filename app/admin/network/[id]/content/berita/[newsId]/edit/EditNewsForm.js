'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
    body: news.body || '',
    category: news.category || 'Kabar Wilayah',
    isPublished: news.is_published !== false,
    autoFetch: false,
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [imageMode, setImageMode] = useState('url')
  const [imageFile, setImageFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')

  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])

  function chooseImage(file) {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setImageFile(file)
    setFilePreview(file ? URL.createObjectURL(file) : '')
  }

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
      formData.set('image_mode', imageMode)
      if (imageFile && imageMode === 'upload') formData.set('image_file', imageFile)
      formData.set('excerpt', form.excerpt)
      formData.set('body', form.body)
      formData.set('category', form.category)
      formData.set('is_published', String(form.isPublished))
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
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Berita</h1><p className="mt-1 text-sm text-slate-500">{website.name} — <Link href={`/${website.subdomain}`} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:underline">/{website.subdomain}<ExternalLink className="h-3 w-3" /></Link></p></div>
        <Link href={`/admin/network/${website.id}/content/berita`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Kembali</Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900">Konten Publikasi Berita</h2><p className="mt-1 text-xs text-slate-500">Atur tampilan berita pada arsip dan halaman detail publik.</p></div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label htmlFor="news-title" className="mb-2 block text-sm font-semibold text-slate-700">Judul Berita <span className="text-rose-500">*</span></label><input id="news-title" required maxLength={500} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Masukkan judul berita..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="news-category" className="mb-2 block text-sm font-semibold text-slate-700">Kategori Berita</label><input id="news-category" maxLength={120} value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Kabar Wilayah" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div><div><label htmlFor="news-author" className="mb-2 block text-sm font-semibold text-slate-700">Penulis / Redaksi</label><input id="news-author" maxLength={255} value={form.author} onChange={(event) => update('author', event.target.value)} placeholder="Humas Kecamatan" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div></div>
          <div className="space-y-3"><span className="block text-sm font-semibold text-slate-700">Gambar Utama / Thumbnail</span><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setImageMode('url'); chooseImage(null) }} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${imageMode === 'url' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600'}`}>Pakai link gambar</button><button type="button" onClick={() => setImageMode('upload')} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${imageMode === 'upload' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600'}`}>Unggah dari perangkat</button></div>{imageMode === 'url' ? <input id="news-image" type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="https://alamat-gambar.jpg" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /> : <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-600 hover:border-teal-500"><span className="font-semibold">Pilih gambar JPG, PNG, WebP, atau GIF</span><span className="mt-1 text-xs text-slate-500">Maksimal 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseImage(event.target.files?.[0] || null)} className="sr-only" /></label>}{(filePreview || (imageMode === 'url' && form.image)) && <div className="relative h-48 max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><img src={filePreview || form.image} alt="Pratinjau thumbnail berita" className="h-full w-full object-contain" /></div>}</div>
          <div><label htmlFor="news-excerpt" className="mb-2 block text-sm font-semibold text-slate-700">Ringkasan Berita</label><textarea id="news-excerpt" rows={3} maxLength={5000} value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} placeholder="Ringkasan yang tampil di kartu dan pembuka artikel" className="w-full resize-y rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div><label htmlFor="news-body" className="mb-2 block text-sm font-semibold text-slate-700">Isi Berita</label><textarea id="news-body" rows={12} maxLength={100000} value={form.body} onChange={(event) => update('body', event.target.value)} placeholder="Isi artikel. Pisahkan paragraf dengan satu baris kosong." className="w-full resize-y rounded-xl border border-slate-200 p-4 text-sm leading-7 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-700">Sumber berita luar (opsional)</summary><label htmlFor="news-url" className="mb-2 mt-4 block text-sm font-semibold text-slate-700">URL Sumber</label><input id="news-url" type="url" value={form.url} onChange={(event) => update('url', event.target.value)} placeholder="https://sumber.go.id/berita/..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /><label className="mt-4 inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={form.autoFetch} onChange={(event) => update('autoFetch', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />Ambil ulang judul/gambar/ringkasan otomatis dari URL sumber</label></details>
          <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600" />Berita diterbitkan dan tampil di portal publik</label>
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row"><Link href={`/admin/network/${website.id}/content/berita`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Batal</Link><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Save className="h-4 w-4" />}{loading ? 'Menyimpan…' : 'Simpan Berita'}</button></div>
        </form>
      </section>
    </div>
  )
}
