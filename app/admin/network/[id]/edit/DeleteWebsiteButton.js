'use client'

import { useState } from 'react'
import { deleteWebsiteAction } from '../../actions'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'

export default function DeleteWebsiteButton({ websiteId, websiteName }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirmDelete() {
    setLoading(true)
    const formData = new FormData()
    formData.set('id', websiteId)
    await deleteWebsiteAction(formData)
    setLoading(false)
    setShowConfirm(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-sm font-semibold transition-all cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Hapus Website Ini
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Pindahkan Website ke Sampah?"
        message={`Apakah Anda yakin ingin memindahkan website "${websiteName}" ke folder Sampah?\n\nWebsite tidak akan bisa diakses publik sementara waktu, tetapi Anda dapat memulihkannya kembali dari menu Sampah kapan saja.`}
        confirmText="Hapus ke Sampah"
        cancelText="Batal"
        type="danger"
        loading={loading}
      />
    </>
  )
}
