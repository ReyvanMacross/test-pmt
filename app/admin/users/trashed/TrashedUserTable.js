'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import { restoreUserAction, permanentDeleteUserAction } from '../actions'

const ROLE_LABELS = {
  'super-admin': 'Super Administrator',
  'admin-dinas': 'Admin Dinas',
  'admin-kecamatan': 'Admin Kecamatan',
  'admin-kelurahan': 'Admin Kelurahan',
}

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatDate(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const PER_PAGE = 10

export default function TrashedUserTable({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: null, // 'restore' | 'permanent_delete'
    user: null,
    loading: false,
  })

  // Alert modal state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    )
  }, [users, search])

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / PER_PAGE) || 1
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return filteredUsers.slice(start, start + PER_PAGE)
  }, [filteredUsers, page])

  function handlePromptRestore(user) {
    setConfirmModal({
      isOpen: true,
      actionType: 'restore',
      user,
      loading: false,
    })
  }

  function handlePromptPermanentDelete(user) {
    setConfirmModal({
      isOpen: true,
      actionType: 'permanent_delete',
      user,
      loading: false,
    })
  }

  async function handleExecuteAction() {
    const { actionType, user } = confirmModal
    if (!user || !actionType) return

    setConfirmModal((prev) => ({ ...prev, loading: true }))

    try {
      if (actionType === 'restore') {
        const res = await restoreUserAction(user.id)
        if (res?.error) {
          setConfirmModal({ isOpen: false, actionType: null, user: null, loading: false })
          setAlertModal({
            isOpen: true,
            title: 'Gagal Memulihkan',
            message: res.error,
            type: 'danger',
          })
        } else {
          setUsers((prev) => prev.filter((u) => u.id !== user.id))
          setConfirmModal({ isOpen: false, actionType: null, user: null, loading: false })
          setAlertModal({
            isOpen: true,
            title: 'Berhasil Dipulihkan',
            message: res.message || `Akun "${user.name}" telah berhasil dipulihkan.`,
            type: 'success',
          })
        }
      } else if (actionType === 'permanent_delete') {
        const res = await permanentDeleteUserAction(user.id)
        if (res?.error) {
          setConfirmModal({ isOpen: false, actionType: null, user: null, loading: false })
          setAlertModal({
            isOpen: true,
            title: 'Gagal Menghapus Permanen',
            message: res.error,
            type: 'danger',
          })
        } else {
          setUsers((prev) => prev.filter((u) => u.id !== user.id))
          setConfirmModal({ isOpen: false, actionType: null, user: null, loading: false })
          setAlertModal({
            isOpen: true,
            title: 'Dihapus Permanen',
            message: res.message || `Akun "${user.name}" telah dihapus secara permanen.`,
            type: 'success',
          })
        }
      }
    } catch (err) {
      setConfirmModal({ isOpen: false, actionType: null, user: null, loading: false })
      setAlertModal({
        isOpen: true,
        title: 'Kesalahan Sistem',
        message: err.message || 'Terjadi kesalahan sistem.',
        type: 'danger',
      })
    }
  }

  return (
    <>
      {/* ── Page Title Banner Card ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            User Terhapus (Sampah)
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Daftar akun pengguna yang telah dihapus sementara. Anda dapat memulihkan atau menghapus secara permanen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali</span>
          </Link>
        </div>
      </div>

      {/* ── Main Content: Data Table Card ─────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header / Filter Bar */}
        <div className="bg-white border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Daftar Pengguna Terhapus</h2>
          </div>
          <div className="relative">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Cari nama atau email terhapus..."
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl pl-9 pr-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition placeholder-slate-400"
            />
          </div>
        </div>

        {/* Table Component */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">NAMA PENGGUNA</th>
                <th className="py-3.5 px-6">EMAIL</th>
                <th className="py-3.5 px-6">ROLE</th>
                <th className="py-3.5 px-6">TANGGAL DIHAPUS</th>
                <th className="py-3.5 px-6 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {search ? 'Tidak ada pengguna terhapus yang cocok.' : 'Tidak ada pengguna di daftar sampah.'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const rowNumber = (page - 1) * PER_PAGE + idx + 1
                  const initials = getInitials(user.name)

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-400 font-semibold">
                        {rowNumber}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs leading-tight">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                              {ROLE_LABELS[user.role] || user.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-600">
                        {user.email}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-600 font-medium inline-block">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {formatDate(user.deleted_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Tombol Pulihkan */}
                          <button
                            type="button"
                            onClick={() => handlePromptRestore(user)}
                            className="w-36 px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-start gap-2 whitespace-nowrap cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Pulihkan</span>
                          </button>

                          {/* Tombol Hapus Permanen */}
                          <button
                            type="button"
                            onClick={() => handlePromptPermanentDelete(user)}
                            className="w-36 px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50/50 hover:border-rose-300 hover:text-rose-600 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-start gap-2 whitespace-nowrap text-left cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Hapus Permanen</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Menampilkan {filteredUsers.length > 0 ? (page - 1) * PER_PAGE + 1 : 0}–
            {Math.min(page * PER_PAGE, filteredUsers.length)} dari {filteredUsers.length} pengguna terhapus
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed bg-white font-medium shadow-xs hover:bg-slate-50 transition cursor-pointer"
              type="button"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer ${
                  page === p
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                type="button"
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed bg-white font-medium shadow-xs hover:bg-slate-50 transition cursor-pointer"
              type="button"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* ── Action Confirmation Modal (Pulihkan / Hapus Permanen) ────── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, actionType: null, user: null, loading: false })}
        onConfirm={handleExecuteAction}
        title={
          confirmModal.actionType === 'restore'
            ? 'Pulihkan Akun Pengguna?'
            : 'Hapus Akun Pengguna Secara Permanen?'
        }
        message={
          confirmModal.actionType === 'restore'
            ? `Apakah Anda yakin ingin memulihkan akun pengguna "${confirmModal.user?.name}" (${confirmModal.user?.email})?\n\nAkun ini akan kembali aktif dan dapat login ke portal.`
            : `PERINGATAN: Tindakan ini TIDAK DAPAT DIBATALKAN!\n\nAkun pengguna "${confirmModal.user?.name}" (${confirmModal.user?.email}) akan dihapus secara permanen dari basis data sistem.`
        }
        confirmText={
          confirmModal.actionType === 'restore' ? 'Pulihkan Akun' : 'Hapus Permanen'
        }
        cancelText="Batal"
        type={confirmModal.actionType === 'restore' ? 'info' : 'danger'}
        loading={confirmModal.loading}
      />

      {/* ── Feedback Alert Modal ─────────────────────────────────────── */}
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
