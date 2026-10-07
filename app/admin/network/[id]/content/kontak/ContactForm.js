'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import { saveContactAction } from './actions'

const contactFields = [
  'contact_address', 'operating_hours', 'office_phone', 'whatsapp_phone', 'official_email',
  'google_maps_url', 'instagram_username', 'facebook_page_name', 'youtube_channel_url',
]

export default function ContactForm({ website, initialContact = {} }) {
  const router = useRouter()
  const [values, setValues] = useState(() => Object.fromEntries(contactFields.map((field) => [field, initialContact[field] || ''])))
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400'
  function setField(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function notify(type, message) { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      contactFields.forEach((field) => formData.set(field, values[field]))
      const result = await saveContactAction(website.id, formData)
      if (result?.error) notify('error', result.error)
      else { notify('success', result.message || 'Informasi kontak berhasil disimpan.'); router.refresh() }
    } catch (error) { notify('error', error.message || 'Gagal menyimpan informasi kontak.') }
    finally { setLoading(false) }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    {toast && <div role="status" className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><strong>{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</strong><span>{toast.message}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><X className="h-4 w-4"/></button></div>}
    <div className="mb-5 border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-slate-900">Informasi Kontak &amp; Media Sosial Instansi</h2><p className="mt-1 text-sm text-slate-500">Atur alamat kantor, nomor telepon resmi, email, dan akun media sosial yang akan ditampilkan pada portal publik.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 border-b border-slate-100 pb-5 lg:grid-cols-2">
        <div><label htmlFor="contact-address" className="mb-2 block text-sm font-semibold text-slate-800">Alamat Lengkap Kantor</label><textarea id="contact-address" name="contact_address" rows={3} maxLength={10000} value={values.contact_address} onChange={setField} placeholder="Masukkan alamat lengkap kantor instansi beserta kode pos…" className={`${inputClass} resize-y`}/><p className="mt-1.5 text-xs text-slate-500">Pastikan penulisan alamat memuat nomor gedung, RT/RW, dan kode pos yang valid.</p></div>
        <div><label htmlFor="contact-hours" className="mb-2 block text-sm font-semibold text-slate-800">Jam Operasional Pelayanan</label><textarea id="contact-hours" name="operating_hours" rows={3} maxLength={5000} value={values.operating_hours} onChange={setField} placeholder={'Contoh: Senin - Jumat: 08.00 - 15.30 WIB\nSabtu - Minggu: Libur'} className={`${inputClass} resize-y`}/><p className="mt-1.5 text-xs text-slate-500">Cantumkan informasi jadwal operasional tatap muka dan hari libur nasional.</p></div>
      </div>
      <div className="grid grid-cols-1 gap-5 border-b border-slate-100 pb-5 md:grid-cols-2">
        <div><label htmlFor="contact-phone" className="mb-2 block text-sm font-semibold text-slate-800">Nomor Telepon Kantor</label><input id="contact-phone" name="office_phone" type="tel" maxLength={100} value={values.office_phone} onChange={setField} placeholder="Contoh: (022) 5221234" className={inputClass}/></div>
        <div><label htmlFor="contact-whatsapp" className="mb-2 block text-sm font-semibold text-slate-800">Nomor WhatsApp Hotline / Pengaduan</label><input id="contact-whatsapp" name="whatsapp_phone" type="tel" maxLength={100} value={values.whatsapp_phone} onChange={setField} placeholder="Contoh: 0812-3456-7890" className={inputClass}/></div>
        <div><label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-slate-800">Email Resmi Instansi</label><input id="contact-email" name="official_email" type="email" maxLength={255} value={values.official_email} onChange={setField} placeholder="Contoh: humas@instansi.go.id" className={inputClass}/></div>
        <div><label htmlFor="contact-maps" className="mb-2 block text-sm font-semibold text-slate-800">Link Google Maps Embed / Shared URL <span className="font-normal text-slate-400">(Opsional)</span></label><input id="contact-maps" name="google_maps_url" type="url" maxLength={2000} value={values.google_maps_url} onChange={setField} placeholder="Contoh: https://maps.google.com/?q=Kecamatan+Bojongloa+Kidul" className={inputClass}/></div>
      </div>
      <div className="grid grid-cols-1 gap-5 border-b border-slate-100 pb-5 md:grid-cols-3">
        <div><label htmlFor="contact-instagram" className="mb-2 block text-sm font-semibold text-slate-800">Instagram Username</label><input id="contact-instagram" name="instagram_username" maxLength={255} value={values.instagram_username} onChange={setField} placeholder="Contoh: @bojongloakidul" className={inputClass}/></div>
        <div><label htmlFor="contact-facebook" className="mb-2 block text-sm font-semibold text-slate-800">Facebook Page Name</label><input id="contact-facebook" name="facebook_page_name" maxLength={255} value={values.facebook_page_name} onChange={setField} placeholder="Contoh: Kecamatan Bojongloa Kidul" className={inputClass}/></div>
        <div><label htmlFor="contact-youtube" className="mb-2 block text-sm font-semibold text-slate-800">YouTube Channel URL</label><input id="contact-youtube" name="youtube_channel_url" type="url" maxLength={2000} value={values.youtube_channel_url} onChange={setField} placeholder="Contoh: https://youtube.com/@bojongloakidulofficial" className={inputClass}/></div>
      </div>
      <div className="flex flex-col-reverse items-stretch justify-end gap-2 pt-1 sm:flex-row sm:items-center"><Link href={`/admin/network/${website.id}/content`} className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50">Batal</Link><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/> : <Save className="h-4 w-4"/>}{loading ? 'Menyimpan…' : 'Simpan Perubahan Kontak'}</button></div>
    </form>
  </section>
}
