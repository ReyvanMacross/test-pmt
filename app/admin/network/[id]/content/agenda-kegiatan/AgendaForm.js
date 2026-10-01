'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Save, X } from 'lucide-react'
import { createAgendaAction, updateAgendaAction } from './actions'

function dateInput(value) { return typeof value === 'string' ? value.slice(0, 10) : value ? new Date(value).toISOString().slice(0, 10) : '' }

export default function AgendaForm({ website, initialAgenda = null, onCreated }) {
  const router = useRouter()
  const [title, setTitle] = useState(initialAgenda?.title || '')
  const [description, setDescription] = useState(initialAgenda?.description || '')
  const [startDate, setStartDate] = useState(dateInput(initialAgenda?.start_date))
  const [endDate, setEndDate] = useState(dateInput(initialAgenda?.end_date))
  const [timeRange, setTimeRange] = useState(initialAgenda?.time_range || '')
  const [location, setLocation] = useState(initialAgenda?.location || '')
  const [organizer, setOrganizer] = useState(initialAgenda?.organizer || '')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const isEdit = Boolean(initialAgenda)
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400'
  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }

  async function submit(event) {
    event.preventDefault(); setLoading(true)
    try {
      const data = new FormData()
      data.set('title', title); data.set('description', description); data.set('start_date', startDate); data.set('end_date', endDate)
      data.set('time_range', timeRange); data.set('location', location); data.set('organizer', organizer)
      const result = isEdit ? await updateAgendaAction(website.id, initialAgenda.id, data) : await createAgendaAction(website.id, data)
      if (result?.error) notify('error', result.error)
      else {
        notify('success', result.message || 'Agenda berhasil disimpan.')
        if (!isEdit && result.agenda) onCreated?.(result.agenda)
        router.refresh()
        if (isEdit) setTimeout(() => router.push(`/admin/network/${website.id}/content/agenda-kegiatan`), 700)
        else { setTitle(''); setDescription(''); setStartDate(''); setEndDate(''); setTimeRange(''); setLocation(''); setOrganizer('') }
      }
    } catch (error) { notify('error', error.message || 'Gagal menyimpan agenda.') }
    finally { setLoading(false) }
  }

  return <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
    <div className="mb-5 space-y-1 border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Data Agenda Kegiatan' : 'Tambah Agenda Kegiatan Baru'}</h2><p className="text-sm text-slate-500">{isEdit ? 'Perbarui informasi, jadwal pelaksanaan, lokasi, atau penyelenggara kegiatan.' : 'Jadwalkan kegiatan, acara resmi, atau agenda pimpinan instansi.'}</p></div>
    <form onSubmit={submit} className="space-y-4">
      <div><label htmlFor="agenda-title" className="mb-1.5 block text-sm font-semibold text-slate-700">Nama / Judul Agenda</label><input id="agenda-title" required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Masukkan nama kegiatan…" className={inputClass}/></div>
      <div><label htmlFor="agenda-description" className="mb-1.5 block text-sm font-semibold text-slate-700">Deskripsi &amp; Rincian Kegiatan</label><textarea id="agenda-description" required maxLength={50000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tuliskan deskripsi agenda dan hal yang akan dilakukan…" className={`${inputClass} resize-y p-4`}/></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div><label htmlFor="agenda-start" className="mb-1.5 block text-sm font-semibold text-slate-700">Tanggal Mulai</label><input id="agenda-start" type="date" required value={startDate} onChange={(event) => { setStartDate(event.target.value); if (endDate && event.target.value > endDate) setEndDate(event.target.value) }} className={inputClass}/></div><div><label htmlFor="agenda-end" className="mb-1.5 block text-sm font-semibold text-slate-700">Tanggal Selesai</label><input id="agenda-end" type="date" required min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass}/></div><div><label htmlFor="agenda-time" className="mb-1.5 block text-sm font-semibold text-slate-700">Jam / Waktu Pelaksanaan</label><input id="agenda-time" maxLength={100} value={timeRange} onChange={(event) => setTimeRange(event.target.value)} placeholder="08.00 - 15.00 WIB" className={inputClass}/></div></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><label htmlFor="agenda-location" className="mb-1.5 block text-sm font-semibold text-slate-700">Lokasi / Tempat</label><input id="agenda-location" maxLength={500} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Misal: Aula Kantor Kecamatan / Lapangan RW 04" className={inputClass}/></div><div><label htmlFor="agenda-organizer" className="mb-1.5 block text-sm font-semibold text-slate-700">Penyelenggara / Bidang <span className="text-xs font-normal text-slate-400">(Opsional)</span></label><input id="agenda-organizer" maxLength={255} value={organizer} onChange={(event) => setOrganizer(event.target.value)} placeholder="Misal: Seksi Pemerintahan" className={inputClass}/></div></div>
      <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">{isEdit ? <Link href={`/admin/network/${website.id}/content/agenda-kegiatan`} className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50">Batal</Link> : null}<button type="submit" disabled={loading || !title.trim() || !description.trim() || !startDate || !endDate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> : isEdit ? <Save className="h-4 w-4"/> : <CalendarDays className="h-4 w-4"/>}{loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Jadwalkan Agenda'}</button></div>
    </form>
  </section>
}
