'use client'

import { useEffect } from 'react'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  loading = false,
  isAlert = false, // Jika true, hanya tombol OK/Tutup
}) {
  // Tutup dengan tombol Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  // Warna & Ikon berdasarkan type
  let iconBg = 'bg-rose-50 text-rose-600 border-rose-100'
  let confirmBtnCls = 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
  let iconSvg = (
    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )

  if (type === 'warning') {
    iconBg = 'bg-amber-50 text-amber-600 border-amber-100'
    confirmBtnCls = 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
    iconSvg = (
      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  } else if (type === 'success') {
    iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-100'
    confirmBtnCls = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
    iconSvg = (
      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    )
  } else if (type === 'info') {
    iconBg = 'bg-blue-50 text-blue-600 border-blue-100'
    confirmBtnCls = 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
    iconSvg = (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-6 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${iconBg}`}>
            {iconSvg}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            <div className="text-xs text-slate-500 leading-relaxed mt-1.5 whitespace-pre-line">
              {message}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          {!isAlert && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer disabled:opacity-60"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm()
              else onClose()
            }}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60 ${confirmBtnCls}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
