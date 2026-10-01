'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Search, Trash2, X } from 'lucide-react'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import ServiceForm from './ServiceForm'
import { deleteServiceAction } from './actions'

const PER_PAGE = 8
const categoryLabels = { kependudukan: 'Kependudukan & Pencatatan Sipil', sosial: 'Kesejahteraan Sosial', perizinan: 'Perizinan & Non-Perizinan', pemerintahan: 'Pemerintahan & Umum' }

export default function ServicesManagerClient({ website, initialServices }) {
  const router = useRouter()
  const [services, setServices] = useState(initialServices)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? services.filter((item) => `${item.name} ${item.category} ${item.description} ${item.requirements || ''} ${item.procedure || ''}`.toLowerCase().includes(term)) : services
  }, [services, search])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function deleteService() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const result = await deleteServiceAction(website.id, pendingDelete.id)
      if (result?.error) notify('error', result.error)
      else { setServices((current) => current.filter((item) => item.id !== pendingDelete.id)); setPendingDelete(null); notify('success', result.message); router.refresh() }
    } catch (error) { notify('error', error.message || 'Gagal menghapus layanan.') }
    finally { setDeleting(false) }
  }

  return <div className="w-full space-y-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Layanan Publik</h1><p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500"><span>{website.name}</span><span>—</span><Link href={`/${website.subdomain}`} target="_blank" className="text-blue-600 hover:underline">/{website.subdomain} <ExternalLink className="inline h-3 w-3"/></Link></p></div><Link href={`/admin/network/${website.id}/content`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4"/>Kembali</Link></section>
    <ServiceForm website={website} onCreated={(service) => { setServices((current) => [...current, service].sort((a, b) => a.name.localeCompare(b.name))); setPage(1) }}/>
    <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-900">Daftar Layanan Publik ({filtered.length})</h2><p className="mt-1 text-sm text-slate-500">Informasi yang dapat digunakan warga untuk memahami pelayanan instansi.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari layanan…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/></div></div>
      <div className="space-y-3">{visible.length ? visible.map((service) => <article key={service.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-800">{service.name}</h3><span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{categoryLabels[service.category] || service.category}</span></div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{service.description}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">{service.requirements && <span><b className="text-slate-600">Persyaratan:</b> {service.requirements}</span>}{service.completion_time && <span><b className="text-slate-600">Waktu:</b> {service.completion_time}</span>}{service.fee && <span><b className="text-slate-600">Tarif:</b> {service.fee}</span>}{service.application_url && <a href={service.application_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">Buka aplikasi <ExternalLink className="h-3 w-3"/></a>}</div></div><div className="flex shrink-0 items-center justify-end gap-2"><Link href={`/admin/network/${website.id}/content/layanan/${service.id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">Edit</Link><button type="button" onClick={() => setPendingDelete(service)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/>Hapus</button></div></article>) : <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">{search ? 'Layanan tidak ditemukan.' : 'Belum ada layanan publik. Tambahkan layanan pertama melalui formulir di atas.'}</div>}</div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Menampilkan {filtered.length ? (page - 1) * PER_PAGE + 1 : 0}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} layanan</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">‹ Sebelumnya</button><span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">Halaman {page} dari {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Berikutnya ›</button></div></div>
    </section>
    <ConfirmModal isOpen={Boolean(pendingDelete)} onClose={() => !deleting && setPendingDelete(null)} onConfirm={deleteService} title="Hapus layanan?" message={`Layanan “${pendingDelete?.name || ''}” akan dihapus permanen.`} confirmText="Hapus Layanan" cancelText="Batal" loading={deleting}/>
  </div>
}
