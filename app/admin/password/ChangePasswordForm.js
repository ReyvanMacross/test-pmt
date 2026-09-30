'use client'

import { useState, useRef } from 'react'
import { changePasswordAction } from './actions'

// ── Eye Toggle Icon ──────────────────────────────────────────────────────────
function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  )
}

// ── Password Strength Bar ────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    { label: 'Sangat Lemah', color: 'bg-red-500' },
    { label: 'Lemah', color: 'bg-orange-400' },
    { label: 'Sedang', color: 'bg-yellow-400' },
    { label: 'Kuat', color: 'bg-emerald-400' },
    { label: 'Sangat Kuat', color: 'bg-emerald-600' },
  ]
  const current = levels[score]

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? current.color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${
          score <= 1 ? 'text-red-500' : score === 2 ? 'text-yellow-600' : 'text-emerald-600'
        }`}
      >
        Kekuatan: {current.label}
      </p>
    </div>
  )
}

// ── Toast Notification ───────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div
      className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl border max-w-sm ${
        isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
        {isSuccess ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{isSuccess ? 'Berhasil!' : 'Terjadi Kesalahan'}</p>
        <p className="text-xs mt-0.5 leading-snug opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Password Input Field ─────────────────────────────────────────────────────
function PasswordField({ id, name, label, placeholder, required, show, onToggle, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-700 block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          required={required}
          autoComplete={id === 'currentPassword' ? 'current-password' : 'new-password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          tabIndex={-1}
          aria-label="Toggle visibilitas password"
        >
          <EyeIcon visible={show} />
        </button>
      </div>
    </div>
  )
}

// ── Main Form Component ──────────────────────────────────────────────────────
export default function ChangePasswordForm() {
  const formRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [newPassword, setNewPassword] = useState('')

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  function toggleShow(field) {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(formRef.current)
    const res = await changePasswordAction(formData)
    setLoading(false)

    if (res?.error) {
      showToast('error', res.error)
    } else {
      showToast('success', res.message || 'Password berhasil diperbarui.')
      formRef.current?.reset()
      setNewPassword('')
    }
  }

  return (
    <>
      {/* ── Toast ───────────────────────────────────────────────────────── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="space-y-6">
        {/* ── Page Title Banner ──────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Ganti Password</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Ubah password akun Anda untuk menjaga keamanan otentikasi portal.
            </p>
          </div>
        </div>

        {/* ── Two-Column Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Left: Main Form (2/3) ──────────────────────────────────── */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Keamanan Kata Sandi</h2>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Password Saat Ini */}
              <PasswordField
                id="currentPassword"
                name="currentPassword"
                label="Password Saat Ini"
                placeholder="Masukkan password saat ini"
                required
                show={show.current}
                onToggle={() => toggleShow('current')}
              />

              {/* Password Baru */}
              <div>
                <PasswordField
                  id="newPassword"
                  name="newPassword"
                  label="Password Baru"
                  placeholder="Minimal 8 karakter"
                  required
                  show={show.new}
                  onToggle={() => toggleShow('new')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <PasswordStrength password={newPassword} />
                {!newPassword && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Gunakan kombinasi minimal 8 karakter huruf, angka, dan simbol.
                  </p>
                )}
              </div>

              {/* Konfirmasi Password Baru */}
              <PasswordField
                id="confirmPassword"
                name="confirmPassword"
                label="Konfirmasi Password Baru"
                placeholder="Ulangi password baru"
                required
                show={show.confirm}
                onToggle={() => toggleShow('confirm')}
              />

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Simpan Password Baru</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Right: Info Sidebar (1/3) ──────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Ketentuan Password */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Ketentuan Password</h3>
              </div>
              <ul className="p-5 text-xs text-slate-600 space-y-3 leading-relaxed">
                {[
                  'Minimal 8 karakter.',
                  'Mengandung huruf besar (A-Z) dan kecil (a-z).',
                  'Mengandung angka (0-9).',
                  'Mengandung karakter khusus (!@#$%...).',
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg
                      className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs font-semibold text-blue-800">Informasi</span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                Setelah password diperbarui, Anda tidak perlu login ulang pada sesi yang sedang aktif ini.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
