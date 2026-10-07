import 'server-only'
import { query } from '@/lib/db'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'

/** Check whether the active account was assigned to this tenant website. */
export async function canManageWebsite(session, websiteId, ownerId = null) {
  if (!session?.id) return false
  const access = await getCurrentAdminAccess()
  if (!access || String(access.id) !== String(session.id)) return false
  if (access.role === 'super-admin' || hasAdminPermission(access, 'manage-all-websites')) return true
  if (!hasAdminPermission(access, 'manage-assigned-website')) return false
  if (ownerId && String(ownerId) === String(session.id)) return true

  const result = await query(
    `SELECT 1
     FROM website_user_access
     WHERE user_id = $1 AND website_id = $2
     LIMIT 1`,
    [session.id, websiteId]
  )
  return result.rows.length > 0
}

export async function getAssignedWebsiteIds(userId) {
  const result = await query(
    'SELECT website_id FROM website_user_access WHERE user_id = $1 ORDER BY website_id',
    [userId]
  )
  return result.rows.map((row) => String(row.website_id))
}
