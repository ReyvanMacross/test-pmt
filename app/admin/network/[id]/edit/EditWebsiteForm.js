'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateWebsiteAction } from '../../actions'

export default function EditWebsiteForm({ website, templates }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subdomain, setSubdomain] = useState(website.subdomain || '')
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    String(website.template_id || templates?.[0]?.id || '')
  )
  const [status, setStatus] = useState(website.status || 'active')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    // Pastikan nilai terkontrol ter-submit
    formData.set('template_id', selectedTemplateId)
    formData.set('status', status)
    formData.set('subdomain', subdomain)

    const res = await updateWebsiteAction(website.id, formData)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
    // Jika sukses, updateWebsiteAction akan redirect dari server
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* 1. Nama Website */}
      <div>
        <label
          htmlFor="edit-name"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
        >
          Nama Website <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          id="edit-name"
          name="name"
          required
          defaultValue={website.name}
          placeholder="Contoh: Kecamatan Bojongloa Kidul"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
        />
      </div>

      {/* 2. Instansi / Kota */}
      <div>
        <label
          htmlFor="edit-description"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
        >
          Instansi / Kota
        </label>
        <input
          type="text"
          id="edit-description"
          name="description"
          defaultValue={website.description || ''}
          placeholder="Pemerintah Kota Bandung"
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
        />
        <p className="text-xs text-slate-400 mt-1.5">
          Tampil sebagai sub-judul di navbar website (maks 100 karakter)
        </p>
      </div>

      {/* 3. Subdomain */}
      <div>
        <label
          htmlFor="edit-subdomain"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
        >
          Subdomain <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <span className="bg-slate-100 text-slate-500 px-3.5 py-3 text-sm font-mono border-r border-slate-200 select-none whitespace-nowrap shrink-0">
            https://bandung.go.id/
          </span>
          <input
            type="text"
            id="edit-subdomain"
            name="subdomain"
            required
            value={subdomain}
            onChange={(e) =>
              setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }
            placeholder="nama-instansi"
            className="w-full px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 font-mono outline-none bg-white"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Subdomain unik yang digunakan sebagai alamat akses resmi website.
        </p>
      </div>

      {/* 4. Template Website & Status — 2 kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Template */}
        <div>
          <label
            htmlFor="edit-template"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Template Website <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="edit-template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer pr-10"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={String(tpl.id)}>
                  {tpl.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {/* Hidden input for form data */}
          <input type="hidden" name="template_id" value={selectedTemplateId} />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="edit-status"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Status Website <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer pr-10"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <input type="hidden" name="status" value={status} />
        </div>
      </div>

      {/* ── Tombol Aksi ────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Simpan Perubahan</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
