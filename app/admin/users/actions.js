'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'

// ── Helper verifikasi super admin ─────────────────────────────────────────────
async function checkUserManager() {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !hasAdminPermission(access, 'manage-users')) {
    throw new Error('Akses ditolak. Anda tidak memiliki izin mengelola pengguna.')
  }
  return access
}

// ─── 1. CREATE USER ACTION ───────────────────────────────────────────────────
export async function createUserAction(formData) {
  try {
    const session = await checkUserManager()

    const name = formData.get('name')?.trim()
    const email = formData.get('email')?.trim().toLowerCase()
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword') || formData.get('password_confirmation')
    const role = formData.get('role') || 'admin-kelurahan'
    const instansi = formData.get('instansi')?.trim() || ''
    
    // Parse permissions array or json
    let permissions = []
    const rawPermissions = formData.getAll('permissions[]')
    if (rawPermissions && rawPermissions.length > 0) {
      permissions = rawPermissions
    } else {
      const permsStr = formData.get('permissions')
      if (permsStr) {
        try {
          permissions = JSON.parse(permsStr)
        } catch {
          permissions = []
        }
      }
    }

    if (!name || !email || !password) {
      return { error: 'Nama lengkap, email resmi, dan kata sandi wajib diisi.' }
    }

    if (password.length < 8) {
      return { error: 'Kata sandi minimal harus 8 karakter sesuai standar keamanan.' }
    }

    if (confirmPassword && password !== confirmPassword) {
      return { error: 'Konfirmasi kata sandi tidak cocok dengan kata sandi.' }
    }

    // Validasi role sesuai enum
    const validRoles = ['super-admin', 'admin-dinas', 'admin-kecamatan', 'admin-kelurahan']
    if (!validRoles.includes(role)) {
      return { error: 'Role / peran yang dipilih tidak valid.' }
    }

    if (session.role !== 'super-admin' && (role !== session.role || instansi !== session.instansi)) {
      return { error: 'Anda hanya dapat membuat akun dengan role dan instansi yang sama dengan akun Anda.' }
    }

    if (role !== 'super-admin' && !instansi) {
      return { error: 'Instansi / OPD wajib dipilih untuk peran ini.' }
    }

    // Periksa apakah email sudah terdaftar
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return { error: 'Email sudah terdaftar di sistem. Gunakan email dinas yang lain.' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user baru
    const res = await query(
      `INSERT INTO users (name, email, password, role, instansi, permissions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, role, instansi`,
      [name, email, hashedPassword, role, instansi, JSON.stringify(permissions)]
    )

    const newUser = res.rows[0]

    // Catat log aktivitas
    await query(
      `INSERT INTO activity_logs (user_id, action, description, properties)
       VALUES ($1, $2, $3, $4)`,
      [
        session.id,
        'create_user',
        `Membuat akun pengguna baru "${newUser.name}" (${newUser.email}) untuk instansi ${newUser.instansi || '-'} (${newUser.role}).`,
        JSON.stringify({ created_user_id: newUser.id, role: newUser.role, instansi: newUser.instansi }),
      ]
    )

    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')

    return { success: true, message: `Pengguna "${newUser.name}" berhasil ditambahkan.` }
  } catch (err) {
    console.error('Create User Error:', err)
    return { error: err.message || 'Terjadi kesalahan sistem saat membuat pengguna.' }
  }
}

// ─── 2. UPDATE USER ACTION ───────────────────────────────────────────────────
export async function updateUserAction(formData) {
  try {
    const session = await checkUserManager()

    const id = formData.get('id')
    const name = formData.get('name')?.trim()
    const email = formData.get('email')?.trim().toLowerCase()
    const role = formData.get('role')
    const instansi = formData.get('instansi')?.trim() || ''
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword') || formData.get('password_confirmation')

    // Parse permissions array or json
    let permissions = []
    const rawPermissions = formData.getAll('permissions[]')
    if (rawPermissions && rawPermissions.length > 0) {
      permissions = rawPermissions
    } else {
      const permsStr = formData.get('permissions')
      if (permsStr) {
        try {
          permissions = JSON.parse(permsStr)
        } catch {
          permissions = []
        }
      }
    }

    if (!id || !name || !email || !role) {
      return { error: 'ID, nama lengkap, email, dan peran wajib diisi.' }
    }

    const validRoles = ['super-admin', 'admin-dinas', 'admin-kecamatan', 'admin-kelurahan']
    if (!validRoles.includes(role)) {
      return { error: 'Role / peran yang dipilih tidak valid.' }
    }

    if (role !== 'super-admin' && !instansi) {
      return { error: 'Instansi / OPD wajib dipilih untuk peran ini.' }
    }

    if (session.role !== 'super-admin') {
      const target = await query('SELECT role, instansi FROM users WHERE id = $1 AND deleted_at IS NULL', [id])
      if (!target.rows[0] || target.rows[0].role === 'super-admin' || target.rows[0].instansi !== session.instansi) {
        return { error: 'Anda hanya dapat mengubah akun aktif pada instansi Anda sendiri.' }
      }
      if (role !== session.role || instansi !== session.instansi) {
        return { error: 'Anda tidak dapat mengubah role atau instansi akun.' }
      }
    }

    // Periksa duplikasi email selain user ini
    const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id])
    if (existing.rows.length > 0) {
      return { error: 'Email sudah digunakan oleh akun lain.' }
    }

    let updatedUser
    if (password && password.trim().length > 0) {
      if (password.length < 8) {
        return { error: 'Password baru minimal harus 8 karakter.' }
      }
      if (confirmPassword && password !== confirmPassword) {
        return { error: 'Konfirmasi password baru tidak cocok.' }
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      const res = await query(
        `UPDATE users
         SET name = $1, email = $2, role = $3, instansi = $4, permissions = $5, password = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING id, name, email, role, instansi`,
        [name, email, role, instansi, JSON.stringify(permissions), hashedPassword, id]
      )
      updatedUser = res.rows[0]
    } else {
      const res = await query(
        `UPDATE users
         SET name = $1, email = $2, role = $3, instansi = $4, permissions = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING id, name, email, role, instansi`,
        [name, email, role, instansi, JSON.stringify(permissions), id]
      )
      updatedUser = res.rows[0]
    }

    if (!updatedUser) {
      return { error: 'Pengguna tidak ditemukan.' }
    }

    // Catat log aktivitas
    await query(
      `INSERT INTO activity_logs (user_id, action, description, properties)
       VALUES ($1, $2, $3, $4)`,
      [
        session.id,
        'update_user',
        `Memperbarui data akun pengguna "${updatedUser.name}" (${updatedUser.email}) instansi ${updatedUser.instansi || '-'}.`,
        JSON.stringify({ target_user_id: updatedUser.id, role: updatedUser.role, instansi: updatedUser.instansi }),
      ]
    )

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${id}/edit`)
    revalidatePath('/admin/dashboard')

    return { success: true, message: `Data akun "${updatedUser.name}" berhasil diperbarui.` }
  } catch (err) {
    console.error('Update User Error:', err)
    return { error: err.message || 'Terjadi kesalahan sistem saat memperbarui pengguna.' }
  }
}

// ─── 3. SOFT DELETE USER ACTION ──────────────────────────────────────────────
export async function softDeleteUserAction(userId) {
  try {
    const session = await checkUserManager()

    if (userId === session.id) {
      return { error: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif.' }
    }

    if (session.role !== 'super-admin') {
      const target = await query('SELECT role, instansi FROM users WHERE id = $1 AND deleted_at IS NULL', [userId])
      if (!target.rows[0] || target.rows[0].role === 'super-admin' || target.rows[0].instansi !== session.instansi) {
        return { error: 'Anda hanya dapat menghapus akun aktif pada instansi Anda sendiri.' }
      }
    }

    const res = await query(
      `UPDATE users
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name, email`,
      [userId]
    )

    if (res.rows.length === 0) {
      return { error: 'Pengguna tidak ditemukan atau sudah dihapus.' }
    }

    const deletedUser = res.rows[0]

    // Catat log aktivitas
    await query(
      `INSERT INTO activity_logs (user_id, action, description, properties)
       VALUES ($1, $2, $3, $4)`,
      [
        session.id,
        'delete_user',
        `Memindahkan akun pengguna "${deletedUser.name}" (${deletedUser.email}) ke sampah.`,
        JSON.stringify({ target_user_id: deletedUser.id }),
      ]
    )

    revalidatePath('/admin/users')
    revalidatePath('/admin/users/trashed')
    revalidatePath('/admin/dashboard')

    return { success: true, message: `Pengguna "${deletedUser.name}" dipindahkan ke sampah.` }
  } catch (err) {
    console.error('Soft Delete User Error:', err)
    return { error: err.message || 'Gagal menghapus pengguna.' }
  }
}

// ─── 4. RESTORE USER ACTION ──────────────────────────────────────────────────
export async function restoreUserAction(userId) {
  try {
    const session = await checkUserManager()

    if (session.role !== 'super-admin') {
      const target = await query('SELECT role, instansi FROM users WHERE id = $1 AND deleted_at IS NOT NULL', [userId])
      if (!target.rows[0] || target.rows[0].role === 'super-admin' || target.rows[0].instansi !== session.instansi) {
        return { error: 'Anda hanya dapat memulihkan akun pada instansi Anda sendiri.' }
      }
    }

    const res = await query(
      `UPDATE users
       SET deleted_at = NULL, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING id, name, email`,
      [userId]
    )

    if (res.rows.length === 0) {
      return { error: 'Pengguna tidak ditemukan di daftar sampah.' }
    }

    const restoredUser = res.rows[0]

    // Catat log aktivitas
    await query(
      `INSERT INTO activity_logs (user_id, action, description, properties)
       VALUES ($1, $2, $3, $4)`,
      [
        session.id,
        'restore_user',
        `Memulihkan akun pengguna "${restoredUser.name}" (${restoredUser.email}) dari sampah.`,
        JSON.stringify({ target_user_id: restoredUser.id }),
      ]
    )

    revalidatePath('/admin/users')
    revalidatePath('/admin/users/trashed')
    revalidatePath('/admin/dashboard')

    return { success: true, message: `Pengguna "${restoredUser.name}" berhasil dipulihkan.` }
  } catch (err) {
    console.error('Restore User Error:', err)
    return { error: err.message || 'Gagal memulihkan pengguna.' }
  }
}

// ─── 5. PERMANENT DELETE USER ACTION ─────────────────────────────────────────
export async function permanentDeleteUserAction(userId) {
  try {
    const session = await checkUserManager()

    if (userId === session.id) {
      return { error: 'Tidak dapat menghapus permanen akun Anda sendiri.' }
    }

    if (session.role !== 'super-admin') {
      const target = await query('SELECT role, instansi FROM users WHERE id = $1 AND deleted_at IS NOT NULL', [userId])
      if (!target.rows[0] || target.rows[0].role === 'super-admin' || target.rows[0].instansi !== session.instansi) {
        return { error: 'Anda hanya dapat menghapus permanen akun pada instansi Anda sendiri.' }
      }
    }

    // Ambil data user sebelum dihapus
    const checkRes = await query('SELECT id, name, email FROM users WHERE id = $1', [userId])
    if (checkRes.rows.length === 0) {
      return { error: 'Pengguna tidak ditemukan.' }
    }
    const targetUser = checkRes.rows[0]

    await query('DELETE FROM users WHERE id = $1', [userId])

    // Catat log aktivitas
    await query(
      `INSERT INTO activity_logs (user_id, action, description, properties)
       VALUES ($1, $2, $3, $4)`,
      [
        session.id,
        'permanent_delete_user',
        `Menghapus permanen akun pengguna "${targetUser.name}" (${targetUser.email}).`,
        JSON.stringify({ deleted_user_id: targetUser.id }),
      ]
    )

    revalidatePath('/admin/users')
    revalidatePath('/admin/users/trashed')
    revalidatePath('/admin/dashboard')

    return { success: true, message: `Akun "${targetUser.name}" telah dihapus secara permanen.` }
  } catch (err) {
    console.error('Permanent Delete User Error:', err)
    return { error: err.message || 'Gagal menghapus permanen pengguna.' }
  }
}
