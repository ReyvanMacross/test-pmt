'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTemplateAction, deleteTemplateAction } from '../../actions'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'

export default function EditTemplateForm({ template, usageCount }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [messageModal, setMessageModal] = useState(null) // { title, message, type }
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isUsed = usageCount > 0

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)

    const formData = new FormData(e.currentTarget)
    formData.set('id', template.id)

    const res = await updateTemplateAction(formData)

    if (res?.error) {
      setSaving(false)
      setMessageModal({
        title: 'Gagal Memperbarui Template',
        message: res.error,
        type: 'danger',
      })
    } else {
      setSaving(false)
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 2500)
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    const formData = new FormData()
    formData.set('id', template.id)

    const res = await deleteTemplateAction(formData)

    if (res?.error) {
      setDeleting(false)
      setShowDeleteModal(false)
      setMessageModal({
        title: 'Tidak Dapat Menghapus Template',
        message: res.error,
        type: 'warning',
      })
    } else {
      setDeleting(false)
      setShowDeleteModal(false)
      router.push('/admin/templates')
    }
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Success Banner */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Perubahan template berhasil disimpan!</span>
          </div>
        )}

        {/* 1. Nama Template */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="template-name">
            Nama Template
          </label>
          <input
            id="template-name"
            name="name"
            required
            type="text"
            defaultValue={template.name}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>

        {/* 2. Deskripsi */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="template-desc">
            Deskripsi
          </label>
          <textarea
            id="template-desc"
            name="description"
            rows={3}
            defaultValue={template.description || ''}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition resize-none"
          />
        </div>

        {/* 3. Preview Image Dropzone */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Preview Image
          </label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif"
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-200 rounded-xl bg-white p-1 cursor-pointer"
          />
          <p className="mt-1.5 text-xs text-slate-400">Format: JPG, PNG, GIF. Maks 2MB.</p>
        </div>

        {/* 4. Status */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="template-status">
            Status
          </label>
          <div className="relative">
            <select
              id="template-status"
              name="status"
              defaultValue={template.is_active ? 'aktif' : 'non-aktif'}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition appearance-none cursor-pointer pr-10"
            >
              <option value="aktif">Aktif</option>
              <option value="non-aktif">Non-Aktif</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Form Action Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6">
          <button
            type="button"
            onClick={() => {
              if (isUsed) {
                setMessageModal({
                  title: 'Template Tidak Dapat Dihapus',
                  message: `Template "${template.name}" sedang digunakan oleh ${usageCount} website aktif.\n\nUntuk menghapus template, ubah terlebih dahulu template dari website pengguna.`,
                  type: 'warning',
                })
              } else {
                setShowDeleteModal(true)
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              isUsed
                ? 'bg-rose-50 border border-rose-200 text-rose-400 opacity-60 cursor-not-allowed'
                : 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 cursor-pointer'
            }`}
            title={isUsed ? 'Template sedang digunakan oleh website aktif dan tidak dapat dihapus' : 'Hapus template'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Hapus Template</span>
          </button>

          <button
            id="save-button"
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Perubahan</span>
            )}
          </button>
        </div>
      </form>

      {/* Modal Konfirmasi Hapus Template */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Template?"
        message={`Apakah Anda yakin ingin menghapus template "${template.name}"?\nTemplate yang dihapus tidak akan dapat dipilih lagi.`}
        confirmText="Hapus Template"
        cancelText="Batal"
        type="danger"
        loading={deleting}
      />

      {/* Modal Pesan Peringatan / Info */}
      <ConfirmModal
        isOpen={Boolean(messageModal)}
        onClose={() => setMessageModal(null)}
        title={messageModal?.title || 'Pemberitahuan'}
        message={messageModal?.message || ''}
        confirmText="Mengerti"
        type={messageModal?.type || 'info'}
        isAlert={true}
      />
    </>
  )
}
