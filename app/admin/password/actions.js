'use server'

import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function changePasswordAction(formData) {
  const session = await getSession()
  if (!session) return { error: 'Sesi tidak valid. Silakan login ulang.' }

  const currentPassword = formData.get('currentPassword')?.trim()
  const newPassword = formData.get('newPassword')?.trim()
  const confirmPassword = formData.get('confirmPassword')?.trim()

  // ── Validasi input ──────────────────────────────────────────────────────────
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Semua kolom wajib diisi.' }
  }

  if (newPassword.length < 8) {
    return { error: 'Password baru minimal 8 karakter.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Konfirmasi password baru tidak cocok.' }
  }

  // ── Ambil hash password saat ini dari DB ───────────────────────────────────
  try {
    const userRes = await query(
      'SELECT id, password FROM users WHERE id = $1 AND deleted_at IS NULL',
      [session.id]
    )

    if (userRes.rows.length === 0) {
      return { error: 'Akun tidak ditemukan.' }
    }

    const user = userRes.rows[0]

    // Verifikasi password lama
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return { error: 'Password saat ini tidak sesuai.' }
    }

    // Pastikan password baru tidak sama dengan yang lama
    const isSame = await bcrypt.compare(newPassword, user.password)
    if (isSame) {
      return { error: 'Password baru tidak boleh sama dengan password saat ini.' }
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update ke DB
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, session.id]
    )

    // Catat ke activity log
    await query(
      'INSERT INTO activity_logs (user_id, action, description) VALUES ($1, $2, $3)',
      [session.id, 'change_password', 'Mengganti password akun']
    )

    return { success: true, message: 'Password berhasil diperbarui.' }
  } catch (err) {
    console.error('changePasswordAction error:', err)
    return { error: 'Terjadi kesalahan server. Silakan coba lagi.' }
  }
}
