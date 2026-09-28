import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import UserTable from './UserTable'

export const metadata = {
  title: 'User Management - Multi-Tenant Portal',
}

export default async function UserManagementPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'super-admin') redirect('/admin/dashboard')

  let users = []
  let trashedCount = 0

  try {
    const [resUsers, resTrashed] = await Promise.all([
      query(`
        SELECT id, name, email, role, created_at, updated_at
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at ASC
      `),
      query(`
        SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL
      `),
    ])

    users = resUsers.rows
    trashedCount = parseInt(resTrashed.rows[0].count, 10) || 0
  } catch (err) {
    console.error('Error fetching users in UserManagementPage:', err)
  }

  return (
    <div className="w-full">
      <UserTable
        initialUsers={users}
        currentUserId={session.id}
        trashedCount={trashedCount}
      />
    </div>
  )
}
