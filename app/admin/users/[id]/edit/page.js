import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import EditUserForm from './EditUserForm'

export const metadata = {
  title: 'Edit Informasi User - Multi-Tenant Portal',
}

export default async function EditUserPage({ params }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!hasAdminPermission(access, 'manage-users')) redirect('/admin/dashboard')

  const { id } = await params

  let user = null
  let lastLogin = null
  let websites = []
  let assignedWebsiteId = ''

  try {
    const res = await query(
      `SELECT id, name, email, role, instansi, permissions, created_at, updated_at, deleted_at
       FROM users
       WHERE id = $1 AND ($2::boolean OR instansi = $3)
       LIMIT 1`,
      [id, access.role === 'super-admin', access.instansi]
    )

    if (res.rows.length === 0) {
      notFound()
    }

    user = res.rows[0]

    const [assigned, websiteOptions] = await Promise.all([
      query('SELECT website_id FROM website_user_access WHERE user_id = $1 ORDER BY website_id LIMIT 1', [id]),
      query(
        `SELECT DISTINCT w.id, w.name, w.subdomain, t.slug AS template_slug
         FROM websites w JOIN templates t ON t.id = w.template_id
         LEFT JOIN website_user_access wa ON wa.website_id = w.id AND wa.user_id = $1
         WHERE w.deleted_at IS NULL AND ($2::boolean OR w.user_id = $1 OR wa.user_id = $1)
         ORDER BY w.name`,
        [session.id, access.role === 'super-admin']
      ),
    ])
    assignedWebsiteId = assigned.rows[0]?.website_id ? String(assigned.rows[0].website_id) : ''
    websites = websiteOptions.rows

    // Ambil log login terakhir
    const resLog = await query(
      `SELECT created_at
       FROM activity_logs
       WHERE user_id = $1 AND action = 'login'
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    )

    if (resLog.rows.length > 0) {
      lastLogin = resLog.rows[0].created_at
    }
  } catch (err) {
    console.error('Error fetching user for edit:', err)
    notFound()
  }

  return (
    <div className="w-full">
      <EditUserForm
        user={user}
        currentUserId={session.id}
        lastLogin={lastLogin}
        websites={websites}
        initialAssignedWebsiteId={assignedWebsiteId}
      />
    </div>
  )
}
