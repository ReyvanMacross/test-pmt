'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Save, X } from 'lucide-react'
import { createServiceAction, updateServiceAction } from './actions'

const categories = [
  ['kependudukan', 'Kependudukan & Pencatatan Sipil'],
  ['sosial', 'Kesejahteraan Sosial'],
  ['perizinan', 'Perizinan & Non-Perizinan'],
  ['pemerintahan', 'Pemerintahan & Umum'],
]

export default function ServiceForm({ website, initialService = null, onCreated }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: initialService?.name || '', category: initialService?.category || '',
    description: initialService?.description || '', requirements: initialService?.requirements || '',
    procedure: initialService?.procedure || '', completion_time: initialService?.completion_time || '',
    fee: initialService?.fee || '', application_url: initialService?.application_url || '',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const isEdit = Boolean(initialService)
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400'
  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }

  async function submit(event) {
    event.preventDefault(); setLoading(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => data.set(key, value))
      const result = isEdit
        ? await updateServiceAction(website.id, initialService.id, data)
        : await createServiceAction(website.id, data)
      if (result?.error) notify('error', result.error)
      else {
        notify('success', result.message || 'Layanan publik berhasil disimpan.')
        if (!isEdit && result.service) onCreated?.(result.service)
        router.refresh()
        if (isEdit) setTimeout(() => router.push(`/admin/network/${website.id}/content/layanan`), 650)
        else setForm({ name: '', category: '', description: '', requirements: '', procedure: '', completion_time: '', fee: '', application_url: '' })
      }
    } catch (error) { notify('error', error.message || 'Gagal menyimpan layanan publik.') }
    finally { setLoading(false) }
  }

  return <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
    <div className="mb-5 space-y-1 border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Data Layanan Publik' : 'Tambah Layanan Publik Baru'}</h2><p className="text-sm text-slate-500">{isEdit ? 'Perbarui informasi jenis pelayanan, persyaratan, alur, atau estimasi waktu untuk warga.' : 'Tambahkan informasi jenis pelayanan, persyaratan, dan estimasi waktu untuk warga.'}</p></div>
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><label htmlFor="service-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Nama / Jenis Layanan</label><input id="service-name" name="name" required maxLength={255} value={form.name} onChange={update} placeholder="Misal: Pelayanan Kartu Tanda Penduduk Elektronik (e-KTP)" className={inputClass}/></div><div><label htmlFor="service-category" className="mb-1.5 block text-sm font-semibold text-slate-700">Kategori Layanan</label><select id="service-category" name="category" required value={form.category} onChange={update} className={`${inputClass} ${form.category ? '' : 'text-slate-400'}`}><option value="" disabled>-- Pilih Kategori Layanan --</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
      <div><label htmlFor="service-description" className="mb-1.5 block text-sm font-semibold text-slate-700">Deskripsi Singkat Layanan</label><textarea id="service-description" name="description" required maxLength={20000} rows={2} value={form.description} onChange={update} placeholder="Tuliskan ringkasan penjelasan layanan (ditampilkan pada kartu katalog & portal warga)…" className={`${inputClass} resize-y p-4`}/></div>
      <div><label htmlFor="service-requirements" className="mb-1.5 block text-sm font-semibold text-slate-700">Persyaratan Dokumen</label><textarea id="service-requirements" name="requirements" maxLength={20000} rows={3} value={form.requirements} onChange={update} placeholder="Tuliskan berkas persyaratan yang harus dibawa warga (misal: Fotokopi KK, Surat Pengantar RT/RW)…" className={`${inputClass} resize-y p-4`}/></div>
      <div><label htmlFor="service-procedure" className="mb-1.5 block text-sm font-semibold text-slate-700">Prosedur &amp; Alur Pelayanan</label><textarea id="service-procedure" name="procedure" maxLength={20000} rows={3} value={form.procedure} onChange={update} placeholder="Tuliskan langkah-langkah alur pengurusan layanan mulai dari loket pendaftaran hingga pengambilan berkas…" className={`${inputClass} resize-y p-4`}/></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div><label htmlFor="service-time" className="mb-1.5 block text-sm font-semibold text-slate-700">Waktu Penyelesaian</label><input id="service-time" name="completion_time" maxLength={150} value={form.completion_time} onChange={update} placeholder="Misal: 1 Hari Kerja" className={inputClass}/></div><div><label htmlFor="service-fee" className="mb-1.5 block text-sm font-semibold text-slate-700">Biaya / Tarif</label><input id="service-fee" name="fee" maxLength={150} value={form.fee} onChange={update} placeholder="Misal: Gratis (Rp 0)" className={inputClass}/></div><div><label htmlFor="service-url" className="mb-1.5 block text-sm font-semibold text-slate-700">Link Aplikasi / Sistem Online <span className="text-xs font-normal text-slate-400">(Opsional)</span></label><div className="relative"><input id="service-url" name="application_url" type="url" maxLength={2000} value={form.application_url} onChange={update} placeholder="https://… (Opsional)" className={`${inputClass} pr-10`}/>{form.application_url && <a href={form.application_url} target="_blank" rel="noreferrer" aria-label="Buka tautan" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"><ArrowUpRight className="h-4 w-4"/></a>}</div></div></div>
      <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">{isEdit && <Link href={`/admin/network/${website.id}/content/layanan`} className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50">Batal</Link>}<button type="submit" disabled={loading || !form.name.trim() || !form.category || !form.description.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> : <Save className="h-4 w-4"/>}{loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Layanan'}</button></div>
    </form>
  </section>
}
