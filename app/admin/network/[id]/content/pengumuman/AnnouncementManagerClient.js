'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, FileText, Megaphone, Paperclip, Search, Trash2, X } from 'lucide-react'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import AnnouncementForm from './AnnouncementForm'
import { deleteAnnouncementAction } from './actions'

const PER_PAGE = 8
function formatDate(value) { return value ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value)) : '—' }
function statusOf(item) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const today = `${values.year}-${values.month}-${values.day}`
  if (item.publish_date > today) return { label: 'Terjadwal', className: 'border-blue-200 bg-blue-50 text-blue-700' }
  if (item.expires_at && item.expires_at < today) return { label: 'Kedaluwarsa', className: 'border-slate-200 bg-slate-100 text-slate-600' }
  return { label: 'Aktif', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
}

export default function AnnouncementManagerClient({ website, initialAnnouncements }) {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? announcements.filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(term)) : announcements
  }, [announcements, search])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function deleteAnnouncement() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const result = await deleteAnnouncementAction(website.id, pendingDelete.id)
      if (result?.error) notify('error', result.error)
      else { setAnnouncements((current) => current.filter((item) => item.id !== pendingDelete.id)); setPendingDelete(null); notify('success', result.message); router.refresh() }
    } catch (error) { notify('error', error.message || 'Gagal menghapus pengumuman.') }
    finally { setDeleting(false) }
  }

  return <div className="w-full space-y-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Pengumuman</h1><p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500"><span>{website.name}</span><span>—</span><Link href={`/${website.subdomain}`} target="_blank" className="text-blue-600 hover:underline">/{website.subdomain}</Link></p></div><Link href={`/admin/network/${website.id}/content`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4"/>Kembali</Link></section>
    <AnnouncementForm website={website} onCreated={(announcement) => setAnnouncements((current) => [announcement, ...current])}/>
    <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-bold text-slate-900">Daftar Pengumuman ({filtered.length})</h2><div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari pengumuman…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/></div></div>
      <div className="space-y-3">{visible.length ? visible.map((item) => { const status = statusOf(item); return <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600"><Megaphone className="h-5 w-5"/></span><div className="min-w-0"><h3 className="line-clamp-2 text-sm font-bold text-slate-800">{item.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.body}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3"/>Masa berlaku: {formatDate(item.publish_date)} – {formatDate(item.expires_at)}</span><span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${status.className}`}>{status.label}</span>{item.attachment_path && <a href={item.attachment_path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"><Paperclip className="h-3 w-3"/>Ada Lampiran {item.attachment_type === 'application/pdf' ? 'PDF' : 'File'}</a>}</div></div></div><div className="flex shrink-0 items-center justify-end gap-2"><Link href={`/admin/network/${website.id}/content/pengumuman/${item.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"><FileText className="h-3.5 w-3.5"/>Edit</Link><button type="button" onClick={() => setPendingDelete(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/>Hapus</button></div></article> }) : <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">{search ? 'Pengumuman tidak ditemukan.' : 'Belum ada pengumuman. Buat pengumuman pertama melalui formulir di atas.'}</div>}</div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Menampilkan {filtered.length ? (page - 1) * PER_PAGE + 1 : 0} dari {filtered.length} pengumuman</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">‹ Sebelumnya</button><span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">Halaman {page} dari {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Berikutnya ›</button></div></div>
    </section>
    <ConfirmModal isOpen={Boolean(pendingDelete)} onClose={() => !deleting && setPendingDelete(null)} onConfirm={deleteAnnouncement} title="Hapus pengumuman?" message={`Pengumuman “${pendingDelete?.title || ''}” beserta lampirannya akan dihapus.`} confirmText="Hapus Pengumuman" cancelText="Batal" loading={deleting}/>
  </div>
}
