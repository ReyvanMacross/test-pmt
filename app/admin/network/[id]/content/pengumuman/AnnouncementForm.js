'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, FileText, Paperclip, Save, Send, Trash2, Upload, X } from 'lucide-react'
import { createAnnouncementAction, updateAnnouncementAction } from './actions'

function dateInput(value) { return typeof value === 'string' ? value.slice(0, 10) : value ? new Date(value).toISOString().slice(0, 10) : '' }
function formatSize(value) { if (!value) return ''; return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB` }

export default function AnnouncementForm({ website, initialAnnouncement = null, onCancel, onCreated }) {
  const router = useRouter()
  const fileRef = useRef(null)
  const [title, setTitle] = useState(initialAnnouncement?.title || '')
  const [body, setBody] = useState(initialAnnouncement?.body || '')
  const [publishDate, setPublishDate] = useState(dateInput(initialAnnouncement?.publish_date))
  const [expiresAt, setExpiresAt] = useState(dateInput(initialAnnouncement?.expires_at))
  const [file, setFile] = useState(null)
  const [removeAttachment, setRemoveAttachment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const isEdit = Boolean(initialAnnouncement)
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const data = new FormData()
      data.set('title', title)
      data.set('body', body)
      data.set('publish_date', publishDate)
      data.set('expires_at', expiresAt)
      data.set('remove_attachment', String(removeAttachment))
      if (file) data.set('attachment', file)
      const result = isEdit
        ? await updateAnnouncementAction(website.id, initialAnnouncement.id, data)
        : await createAnnouncementAction(website.id, data)
      if (result?.error) notify('error', result.error)
      else {
        notify('success', result.message || 'Pengumuman berhasil disimpan.')
        if (!isEdit && result.announcement) onCreated?.(result.announcement)
        router.refresh()
        if (isEdit) {
          setTimeout(() => router.push(`/admin/network/${website.id}/content/pengumuman`), 500)
        } else {
          setTitle(''); setBody(''); setPublishDate(''); setExpiresAt(''); setFile(null)
          if (fileRef.current) fileRef.current.value = ''
        }
      }
    } catch (error) { notify('error', error.message || 'Terjadi kesalahan saat menyimpan pengumuman.') }
    finally { setLoading(false) }
  }

  return <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:space-y-6 sm:p-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
    <div className="space-y-1 border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Data Pengumuman' : 'Tambah Pengumuman Baru'}</h2><p className="text-sm text-slate-500">{isEdit ? 'Perbarui informasi, masa berlaku, atau berkas lampiran pengumuman.' : 'Buat pemberitahuan resmi atau pengumuman instansi untuk publik.'}</p></div>
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><label htmlFor="announcement-title" className="block text-sm font-semibold text-slate-800">Judul Pengumuman</label><input id="announcement-title" required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Masukkan judul pengumuman…" className={inputClass}/></div>
      <div className="space-y-2"><label htmlFor="announcement-body" className="block text-sm font-semibold text-slate-800">Isi Pengumuman</label><textarea id="announcement-body" required maxLength={50000} rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tuliskan isi ringkasan atau detail pengumuman…" className={`${inputClass} resize-y`}/></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="space-y-2"><label htmlFor="announcement-publish" className="block text-sm font-semibold text-slate-800">Tanggal Terbit</label><div className="relative"><CalendarDays className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input id="announcement-publish" required type="date" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} className={`${inputClass} pl-10`}/></div></div><div className="space-y-2"><label htmlFor="announcement-expires" className="block text-sm font-semibold text-slate-800">Tanggal Kadaluwarsa / Masa Berlaku</label><div className="relative"><CalendarDays className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input id="announcement-expires" type="date" min={publishDate || undefined} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className={`${inputClass} pl-10`}/></div></div></div>
      <div className="space-y-2"><label htmlFor="announcement-attachment" className="block text-sm font-semibold text-slate-800">Dokumen Surat Edaran / PDF <span className="text-xs font-normal text-slate-400">(Opsional)</span></label>
        {isEdit && initialAnnouncement.attachment_path && !removeAttachment && !file ? <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><a href={initialAnnouncement.attachment_path} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 text-sm font-medium text-blue-700 hover:underline"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600"><FileText className="h-5 w-5"/></span><span className="min-w-0"><span className="block truncate">{initialAnnouncement.attachment_name}</span><span className="text-xs font-normal text-slate-500">{formatSize(Number(initialAnnouncement.attachment_size))} • Lampiran</span></span></a><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ganti File</button><button type="button" onClick={() => setRemoveAttachment(true)} aria-label="Hapus lampiran" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4"/></button></div></div> : null}
        {(!isEdit || !initialAnnouncement.attachment_path || removeAttachment || file) && <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-blue-600"><Paperclip className="h-5 w-5"/></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-700">{file?.name || 'Unggah Berkas Lampiran'}</span><span className="block text-xs text-slate-500">{file ? `${formatSize(file.size)} • Berkas baru` : 'Pilih berkas PDF atau gambar (Maks. 5 MB)'}</span></span></div><button type="button" onClick={() => fileRef.current?.click()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"><Upload className="h-3.5 w-3.5"/>Pilih Berkas</button></div>}
        {removeAttachment && !file && <button type="button" onClick={() => setRemoveAttachment(false)} className="text-xs font-semibold text-blue-700 hover:underline">Batalkan penghapusan lampiran</button>}
        {file && <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }} className="text-xs font-semibold text-rose-600 hover:underline">Batalkan pilihan berkas</button>}
        <input ref={fileRef} id="announcement-attachment" type="file" accept=".pdf,image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { const selected = event.target.files?.[0]; if (!selected) return; if (selected.size > 5 * 1024 * 1024) { notify('error', 'Ukuran lampiran maksimal 5 MB.'); event.target.value = ''; return }; setFile(selected); setRemoveAttachment(false) }}/>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">{onCancel ? <button type="button" onClick={onCancel} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Batal</button> : <Link href={`/admin/network/${website.id}/content/pengumuman`} className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</Link>}<button type="submit" disabled={loading || !title.trim() || !body.trim() || !publishDate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> : isEdit ? <Save className="h-4 w-4"/> : <Send className="h-4 w-4"/>}{loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}</button></div>
    </form>
  </section>
}
