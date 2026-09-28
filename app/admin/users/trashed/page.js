import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import TrashedUserTable from './TrashedUserTable'

export const metadata = {
  title: 'User Terhapus (Sampah) - Multi-Tenant Portal',
}

export default async function TrashedUsersPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'super-admin') redirect('/admin/dashboard')

  let trashedUsers = []

  try {
    const res = await query(`
      SELECT id, name, email, role, created_at, updated_at, deleted_at
      FROM users
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `)
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
