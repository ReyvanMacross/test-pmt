'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTemplateAction } from '../actions'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'

export default function CreateTemplateForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [errorModal, setErrorModal] = useState(null) // { title, message }

  function handleNameChange(e) {
    const val = e.target.value
    setName(val)
    // Auto-generate slug
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(generated)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await createTemplateAction(formData)

    if (res?.error) {
      setLoading(false)
      setErrorModal({
        title: 'Gagal Menambahkan Template',
        message: res.error,
      })
    } else {
      setLoading(false)
      router.push('/admin/templates')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Nama Template & Slug Identifier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Field 1: Nama Template * */}
          <div>
            <label htmlFor="nama_template" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Template <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="nama_template"
              name="nama_template"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="misal: Template Dinas Kesehatan"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
            />
          </div>

          {/* Field 2: Slug Identifier * */}
          <div>
            <label htmlFor="slug_identifier" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Slug Identifier <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="slug_identifier"
              name="slug_identifier"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="misal: dinas-kesehatan"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
            />
            <span className="block text-[11px] text-slate-400 mt-1.5">Digunakan sebagai ID sistem &amp; nama folder</span>
          </div>
        </div>

        {/* Field 3: Deskripsi */}
        <div>
          <label htmlFor="deskripsi" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Deskripsi
          </label>
          <textarea
            id="deskripsi"
            name="deskripsi"
            rows={3}
            placeholder="Tuliskan deskripsi ringkas kegunaan template..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs leading-relaxed resize-none"
          />
        </div>

        {/* Field 4: Preview Image */}
        <div>
          <label htmlFor="preview_image" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Preview Image
          </label>
          <input
            type="file"
            id="preview_image"
            name="preview_image"
            accept="image/*"
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-200 rounded-xl bg-white p-1 cursor-pointer transition"
          />
          <span className="block text-[11px] text-slate-400 mt-1.5">Format: JPG, PNG. Maks 2MB.</span>
        </div>

        {/* Field 5: Status Default * */}
        <div>
          <label htmlFor="status_default" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Status Default <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="status_default"
              name="status_default"
              defaultValue="Aktif"
              className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs cursor-pointer pr-10"
            >
              <option value="Aktif">Aktif</option>
              <option value="Non-Aktif">Non-Aktif</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Form Action Footer: Align Right */}
        <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan &amp; Publis Template</span>
            )}
          </button>
        </div>
      </form>

      {/* Modal Pesan Error Pop-Up (Bukan Alert Browser) */}
      <ConfirmModal
        isOpen={Boolean(errorModal)}
        onClose={() => setErrorModal(null)}
        title={errorModal?.title || 'Pemberitahuan'}
        message={errorModal?.message || ''}
        confirmText="Mengerti"
        type="warning"
        isAlert={true}
      />
    </>
  )
}
