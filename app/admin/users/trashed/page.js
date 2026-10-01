import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import TrashedUserTable from './TrashedUserTable'

export const metadata = {
  title: 'User Terhapus (Sampah) - Multi-Tenant Portal',
}

export default async function TrashedUsersPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!hasAdminPermission(access, 'manage-users')) redirect('/admin/dashboard')

  let trashedUsers = []

  try {
    const res = await query(`
      SELECT id, name, email, role, created_at, updated_at, deleted_at
      FROM users
      WHERE deleted_at IS NOT NULL AND ($1::boolean OR instansi = $2)
      ORDER BY deleted_at DESC
    `, [access.role === 'super-admin', access.instansi])
    trashedUsers = res.rows
  } catch (err) {
    console.error('Error fetching trashed users:', err)
  }

  return (
    <div className="w-full">
      <TrashedUserTable initialUsers={trashedUsers} />
    </div>
  )
}
