'use client'

import { useState, useEffect, useMemo } from 'react'
import { createUserAction } from './actions'
import SearchableCombobox from './SearchableCombobox'
import {
  getInstansiOptionsByRole,
  PERMISSION_LIST,
  getDefaultPermissionsByRole,
} from '@/lib/instansi-data'

const ROLE_OPTIONS = [
  { value: 'super-admin', label: 'Super Admin (super-admin)' },
  { value: 'admin-dinas', label: 'Admin Dinas (admin-dinas)' },
  { value: 'admin-kecamatan', label: 'Admin Kecamatan (admin-kecamatan)' },
  { value: 'admin-kelurahan', label: 'Admin Kelurahan (admin-kelurahan)' },
]

export default function UserFormModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [instansi, setInstansi] = useState('')
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // When role changes, update instansi options & default permissions
  const instansiOptions = useMemo(() => {
    if (!role) return []
    return getInstansiOptionsByRole(role)
  }, [role])

  useEffect(() => {
    if (isOpen) {
      // Kosongkan semua field sebelum di-input
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setRole('')
      setInstansi('')
      setPermissions([])
      setErrorMessage('')
    }
  }, [isOpen])

  function handleRoleChange(newRole) {
    setRole(newRole)
    setInstansi('')
    if (newRole) {
      setPermissions(getDefaultPermissionsByRole(newRole))
    } else {
      setPermissions([])
    }
  }

  function handlePermissionToggle(permId) {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    )
  }

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')

    if (!role) {
      setErrorMessage('Pilih role / peran pengguna terlebih dahulu.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Kata sandi minimal harus 8 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi.')
      return
    }

    if (role !== 'super-admin' && !instansi) {
      setErrorMessage('Silakan pilih instansi / OPD.')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('confirmPassword', confirmPassword)
    formData.append('role', role)
    formData.append('instansi', instansi)
    formData.append('permissions', JSON.stringify(permissions))

    try {
      const res = await createUserAction(formData)

      if (res?.error) {
        setErrorMessage(res.error)
      } else {
        if (onSuccess) onSuccess(res?.message || 'Pengguna baru berhasil ditambahkan.')
        onClose()
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-white flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tambah User Baru</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Buat akun pengguna baru dan atur otorisasi hak akses sistem.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5">
              <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nama Lengkap */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: Ahmad Fauzi"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Email Resmi */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Email Resmi <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@diskominfo.go.id"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Kata Sandi & Konfirmasi */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Kombinasi minimal 8 karakter.</p>
          </div>

          {/* Role / Peran Pengguna */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Role / Peran Pengguna <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              required
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition cursor-pointer"
            >
              <option value="">-- Pilih Role --</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Searchable Combobox Instansi / OPD */}
          <SearchableCombobox
            label="Pilih Instansi / OPD"
            required={role !== '' && role !== 'super-admin'}
            options={instansiOptions}
            value={instansi}
            onChange={(val) => setInstansi(val)}
            placeholder={
              !role
                ? 'Pilih role / peran terlebih dahulu...'
                : `Ketik untuk mencari ${
                    role === 'admin-kecamatan'
                      ? 'kecamatan'
                      : role === 'admin-kelurahan'
                      ? 'kelurahan'
                      : role === 'admin-dinas'
                      ? 'dinas'
                      : 'instansi'
                  }...`
            }
          />

          {/* Daftar Hak Akses Terhubung */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Daftar Hak Akses Terhubung:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium">
              {PERMISSION_LIST.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm.id)}
                    onChange={() => handlePermissionToggle(perm.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
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
                <span>Simpan User</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
