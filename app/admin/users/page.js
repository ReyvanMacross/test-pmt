import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import UserTable from './UserTable'

export const metadata = {
  title: 'User Management - Multi-Tenant Portal',
}

export default async function UserManagementPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!hasAdminPermission(access, 'manage-users')) redirect('/admin/dashboard')

  let users = []
  let websites = []
  let trashedCount = 0

  try {
    const userScope = access.role === 'super-admin' ? '' : ' AND instansi = $1'
    const scopeParams = access.role === 'super-admin' ? [] : [access.instansi]
    const [resUsers, resTrashed] = await Promise.all([
      query(`
        SELECT id, name, email, role, created_at, updated_at
        FROM users
        WHERE deleted_at IS NULL${userScope}
        ORDER BY created_at ASC
      `, scopeParams),
      query(`
        SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL${userScope}
      `, scopeParams),
    ])

    users = resUsers.rows
    trashedCount = parseInt(resTrashed.rows[0].count, 10) || 0
    const resWebsites = await query(
      `SELECT DISTINCT w.id, w.name, w.subdomain, t.slug AS template_slug,
              (EXISTS (SELECT 1 FROM website_user_access assigned WHERE assigned.website_id = w.id)
               OR EXISTS (SELECT 1 FROM users existing_owner WHERE existing_owner.id = w.user_id AND existing_owner.role <> 'super-admin')) AS is_assigned
       FROM websites w JOIN templates t ON t.id = w.template_id
       LEFT JOIN website_user_access wa ON wa.website_id = w.id AND wa.user_id = $1
       WHERE w.deleted_at IS NULL AND ($2::boolean OR w.user_id = $1 OR wa.user_id = $1)
       ORDER BY w.name`,
      [session.id, access.role === 'super-admin']
    )
    websites = resWebsites.rows
  } catch (err) {
    console.error('Error fetching users in UserManagementPage:', err)
  }

  return (
    <div className="w-full">
      <UserTable
        initialUsers={users}
        currentUserId={session.id}
        trashedCount={trashedCount}
        websites={websites}
      />
    </div>
  )
}
