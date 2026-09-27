'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/auth'

// ─── LOGIN ACTION ────────────────────────────────────────────────────────────
export async function loginAction(formData) {
  const email = formData.get('email')?.trim()
  const password = formData.get('password')

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' }
  }

  try {
    // Cari user di database PostgreSQL lokal
    const res = await query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
      [email]
    )

    if (res.rows.length === 0) {
      return { error: 'Email atau password salah. Silakan coba lagi.' }
    }

    const user = res.rows[0]

    // Bandingkan password hash bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return { error: 'Email atau password salah. Silakan coba lagi.' }
    }

    // Catat session JWT ke cookie
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })

    // Log login activity
    await query(
      'INSERT INTO activity_logs (user_id, action, description) VALUES ($1, $2, $3)',
      [user.id, 'login', `User ${user.name} logged in`]
    )
  } catch (err) {
    console.error('Login Error:', err)
    return { error: 'Terjadi kesalahan sistem saat proses login.' }
  }

  revalidatePath('/', 'layout')
  redirect('/admin/network')
}

// ─── LOGOUT ACTION ───────────────────────────────────────────────────────────
export async function logoutAction() {
  await deleteSession()
  revalidatePath('/', 'layout')
  redirect('/login')
}
