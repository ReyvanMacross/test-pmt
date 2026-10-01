import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function getCurrentAdminAccess() {
  const session = await getSession()
  if (!session) return null

  const result = await query(
    'SELECT id, name, email, role, instansi, permissions FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [session.id]
  )
  if (!result.rows[0]) return null

  const user = result.rows[0]
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    instansi: user.instansi || '',
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  }
}

export function hasAdminPermission(user, permission) {
  return Boolean(
    user && (user.role === 'super-admin' || user.permissions?.includes(permission))
  )
}
