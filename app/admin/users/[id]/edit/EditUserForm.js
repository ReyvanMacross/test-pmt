'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import SearchableCombobox from '@/app/admin/users/SearchableCombobox'
import { updateUserAction, softDeleteUserAction } from '@/app/admin/users/actions'
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

function formatDate(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatLastLogin(isoString) {
  if (!isoString) return 'Belum pernah login'
  const d = new Date(isoString)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  const timeStr = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isToday) {
    return `Hari ini, ${timeStr} WIB`
  }

  const dateStr = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${dateStr}, ${timeStr} WIB`
}

export default function EditUserForm({ user, currentUserId, lastLogin }) {
  const router = useRouter()
  const isCurrent = user.id === currentUserId

  const [name, setName] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState(user.role || 'admin-kecamatan')
  const [instansi, setInstansi] = useState(user.instansi || '')
  
  // Permissions state
  const initialPerms = useMemo(() => {
    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
      return user.permissions
    }
    return getDefaultPermissionsByRole(user.role || 'admin-kecamatan')
  }, [user.permissions, user.role])

  const [permissions, setPermissions] = useState(initialPerms)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  // Role based instansi options
  const instansiOptions = useMemo(() => {
    return getInstansiOptionsByRole(role)
  }, [role])

  function handleRoleChange(newRole) {
    setRole(newRole)
    const newOpts = getInstansiOptionsByRole(newRole)
    // If current instansi not in new role options, set to top option
    const exists = newOpts.some((o) => o.value === instansi)
    if (!exists) {
      setInstansi(newOpts[0]?.value || '')
    }
    // Update default permissions if user role changes
    setPermissions(getDefaultPermissionsByRole(newRole))
  }

  function handlePermissionToggle(permId) {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')

    if (password) {
      if (password.length < 8) {
        setErrorMessage('Password baru minimal harus 8 karakter.')
        return
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi password baru tidak cocok.')
        return
      }
    }

    if (role !== 'super-admin' && !instansi) {
      setErrorMessage('Silakan pilih instansi / OPD.')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('id', user.id)
    formData.append('name', name)
    formData.append('email', email)
    formData.append('role', role)
    formData.append('instansi', instansi)
    formData.append('permissions', JSON.stringify(permissions))
    if (password) {
      formData.append('password', password)
      formData.append('confirmPassword', confirmPassword)
    }

    try {
      const res = await updateUserAction(formData)
      if (res?.error) {
        setErrorMessage(res.error)
      } else {
        setPassword('')
        setConfirmPassword('')
        setAlertModal({
          isOpen: true,
          title: 'Berhasil',
          message: res.message || 'Data pengguna berhasil diperbarui.',
          type: 'success',
        })
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat memperbarui pengguna.')
    } finally {
      setLoading(false)
    }
  }

  async function handleExecuteDelete() {
    if (isCurrent) {
      setIsDeleteOpen(false)
      setAlertModal({
        isOpen: true,
        title: 'Tindakan Ditolak',
        message: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif.',
        type: 'warning',
      })
      return
    }

    setDeleteLoading(true)
    try {
      const res = await softDeleteUserAction(user.id)
      if (res?.error) {
        setIsDeleteOpen(false)
        setDeleteLoading(false)
        setAlertModal({
          isOpen: true,
          title: 'Gagal Menghapus',
          message: res.error,
          type: 'danger',
        })
      } else {
        setIsDeleteOpen(false)
        setDeleteLoading(false)
        router.push('/admin/users')
      }
    } catch (err) {
      setIsDeleteOpen(false)
      setDeleteLoading(false)
      setAlertModal({
        isOpen: true,
        title: 'Kesalahan Sistem',
        message: err.message || 'Terjadi kesalahan sistem.',
        type: 'danger',
      })
    }
  }

  const shortUserId = `USER-${user.id.slice(0, 6).toUpperCase()}`

  return (
    <>
      <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6">
        {/* Page Title Banner Card with Back Button */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Edit Informasi User
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Perbarui data identitas, peran, instansi, dan otorisasi hak akses pengguna.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors flex-shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali</span>
          </Link>
        </div>

        {/* MAIN FORM GRID (2 KOLOM: 3/4 + 1/4 RATIO) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT FORM CARD (lg:col-span-3) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Detail Akun Pengguna</h2>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5">
                <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field 1: Nama Lengkap */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="user-name">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  id="user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>

              {/* Field 2: Email Resmi */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="user-email">
                  Email Resmi <span className="text-rose-500">*</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition font-mono"
                />
              </div>

              {/* Field 3: Password Baru (Grid 2 Kolom) */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="new-password">
                      Password Baru (Kosongkan jika tidak diubah)
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="confirm-password">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Biarkan kosong jika tidak ingin memperbarui kata sandi pengguna.
                </p>
              </div>

              {/* Field 4: Role / Peran Pengguna */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="user-role">
                  Role / Peran Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="user-role"
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition cursor-pointer appearance-none"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Field 5: Searchable Combobox Instansi / OPD */}
              <SearchableCombobox
                label="Pilih Instansi / OPD"
                required={role !== 'super-admin'}
                options={instansiOptions}
                value={instansi}
                onChange={(val) => setInstansi(val)}
                placeholder={`Cari nama ${
                  role === 'admin-kecamatan'
                    ? 'kecamatan'
                    : role === 'admin-kelurahan'
                    ? 'kelurahan'
                    : role === 'admin-dinas'
                    ? 'dinas'
                    : 'instansi'
                }...`}
              />

              {/* Field 6: DAFTAR HAK AKSES TERHUBUNG */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Daftar Hak Akses Terhubung:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {PERMISSION_LIST.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Footer Action Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6">
                {/* Kiri: Tombol Hapus Akun */}
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    title="Tidak dapat menghapus akun Anda sendiri"
                    className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold opacity-50 cursor-not-allowed"
                  >
                    Hapus Akun
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Hapus Akun
                  </button>
                )}

                {/* Kanan: Tombol Simpan Perubahan */}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
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
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT INFO SIDEBAR (lg:col-span-1) */}
          <div className="lg:col-span-1 space-y-4">
            {/* Card Info Akun */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Ringkasan Akun</h3>
              </div>
              <div className="space-y-3">
                {/* Item 1: Status Akun */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status Akun
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Aktif
                  </span>
                </div>

                {/* Item 2: ID Pengguna */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ID Pengguna
                  </span>
                  <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                    {shortUserId}
                  </span>
                </div>

                {/* Item 3: Tanggal Bergabung */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Bergabung
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {formatDate(user.created_at)}
                  </span>
                </div>

                {/* Item 4: Terakhir Login */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Terakhir Login
                  </span>
                  <span className="text-xs font-semibold text-slate-800 text-right">
                    {formatLastLogin(lastLogin)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notice Box */}
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed shadow-2xs">
              Perubahan hak akses akan langsung berlaku pada sesi login pengguna berikutnya.
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleExecuteDelete}
        title="Pindahkan Akun ke Sampah?"
        message={`Apakah Anda yakin ingin memindahkan akun pengguna "${user.name}" (${user.email}) ke daftar sampah?\n\nAkun ini tidak akan dapat login sementara waktu.`}
        confirmText="Hapus ke Sampah"
        cancelText="Batal"
        type="danger"
        loading={deleteLoading}
      />

      {/* Reusable Alert Modal */}
      <ConfirmModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        isAlert
        confirmText="Tutup"
      />
    </>
  )
}
