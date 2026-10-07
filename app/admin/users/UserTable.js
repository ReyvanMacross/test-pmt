'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ConfirmModal from '@/app/admin/_components/ConfirmModal'
import UserFormModal from './UserFormModal'
import { softDeleteUserAction } from './actions'

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

function getRoleBadge(role) {
  switch (role) {
    case 'super-admin':
      return 'bg-blue-50 text-blue-600 border-blue-200'
    case 'admin-dinas':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'admin-kecamatan':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'admin-kelurahan':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const PER_PAGE = 10

export default function UserTable({ initialUsers, currentUserId, trashedCount = 0, websites = [] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  // Confirm delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null,
    loading: false,
  })

  // Notification alert modal state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  // Filtered users by search
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

  function handleOpenCreate() {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  function handleOpenEdit(user) {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  function handleFormSuccess(message) {
    setAlertModal({
      isOpen: true,
      title: 'Berhasil',
      message: message,
      type: 'success',
    })
  }

  function handleConfirmDelete(user) {
    if (user.id === currentUserId) {
      setAlertModal({
        isOpen: true,
        title: 'Tindakan Ditolak',
        message: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.',
        type: 'warning',
      })
      return
    }

    setDeleteModal({
      isOpen: true,
      user,
      loading: false,
    })
  }

  async function executeSoftDelete() {
    if (!deleteModal.user) return
    setDeleteModal((prev) => ({ ...prev, loading: true }))

    try {
      const res = await softDeleteUserAction(deleteModal.user.id)
      if (res?.error) {
        setDeleteModal({ isOpen: false, user: null, loading: false })
        setAlertModal({
          isOpen: true,
          title: 'Gagal Menghapus',
          message: res.error,
          type: 'danger',
        })
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== deleteModal.user.id))
        setDeleteModal({ isOpen: false, user: null, loading: false })
        setAlertModal({
          isOpen: true,
          title: 'Berhasil',
          message: res.message || 'Pengguna berhasil dipindahkan ke sampah.',
          type: 'success',
        })
      }
    } catch (err) {
      setDeleteModal({ isOpen: false, user: null, loading: false })
      setAlertModal({
        isOpen: true,
        title: 'Kesalahan Sistem',
        message: err.message || 'Terjadi kesalahan saat menghapus pengguna.',
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
            User Management
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Kelola daftar administrator, operator OPD, dan hak akses akun portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tombol Sampah */}
          <Link
            href="/admin/users/trashed"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>Sampah</span>
            {trashedCount > 0 && (
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {trashedCount}
              </span>
            )}
          </Link>

          {/* Tombol Tambah User Baru */}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>Tambah User Baru</span>
          </button>
        </div>
      </div>

      {/* ── Main Content: Data Table Card ─────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header / Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daftar Pengguna</h2>
          </div>
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Cari nama, email, atau role..."
              className="w-72 sm:w-80 px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-slate-800 placeholder-slate-400 shadow-xs"
            />
          </div>
        </div>

        {/* Table Component */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">ID</th>
                <th className="py-3.5 px-5">NAMA PENGGUNA</th>
                <th className="py-3.5 px-5">EMAIL</th>
                <th className="py-3.5 px-5">ROLE</th>
                <th className="py-3.5 px-5">BERGABUNG</th>
                <th className="py-3.5 px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {search ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna terdaftar.'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const isCurrent = user.id === currentUserId
                  const rowNumber = (page - 1) * PER_PAGE + idx + 1
                  const initials = getInitials(user.name)

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 font-mono text-xs text-slate-500 font-semibold">
                        {rowNumber}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-tight">
                              {user.name}
                            </div>
                            {isCurrent ? (
                              <div className="text-[11px] text-blue-600 font-medium leading-tight mt-0.5">
                                Anda (Sesi Aktif)
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                                {ROLE_LABELS[user.role] || user.role}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-xs text-slate-600">
                        {user.email}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded font-mono text-xs font-semibold border ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Tombol Edit */}
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              />
                            </svg>
                            <span>Edit</span>
                          </Link>

                          {/* Tombol Hapus Akun */}
                          {isCurrent ? (
                            <button
                              type="button"
                              disabled
                              title="Tidak dapat menghapus akun Anda sendiri"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold shadow-xs opacity-50 cursor-not-allowed"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                />
                              </svg>
                              <span>Hapus Akun</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                />
                              </svg>
                              <span>Hapus Akun</span>
                            </button>
                          )}
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan {filteredUsers.length > 0 ? (page - 1) * PER_PAGE + 1 : 0}–
            {Math.min(page * PER_PAGE, filteredUsers.length)} dari {filteredUsers.length} pengguna
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-xs hover:bg-slate-50 transition cursor-pointer"
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
                    ? 'bg-blue-600 text-white'
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
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-xs hover:bg-slate-50 transition cursor-pointer"
              type="button"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* ── Form Modal Tambah User ────────────────────────────── */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          handleFormSuccess(msg)
          window.location.reload()
        }}
        websites={websites}
      />

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null, loading: false })}
        onConfirm={executeSoftDelete}
        title="Pindahkan Akun ke Sampah?"
        message={`Apakah Anda yakin ingin memindahkan akun pengguna "${deleteModal.user?.name}" (${deleteModal.user?.email}) ke daftar sampah?\n\nAkun ini tidak akan dapat login sementara waktu, namun dapat dipulihkan kapan saja.`}
        confirmText="Hapus ke Sampah"
        cancelText="Batal"
        type="danger"
        loading={deleteModal.loading}
      />

      {/* ── Reusable Alert / Feedback Modal ──────────────────────────── */}
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
