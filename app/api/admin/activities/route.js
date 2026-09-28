import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const PER_PAGE = 15

export async function GET(request) {
  // Auth check — super-admin only
  const session = await getSession()
  if (!session || session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || String(PER_PAGE), 10))
  const role = searchParams.get('role') || ''
  const date = searchParams.get('date') || ''   // YYYY-MM-DD
  const q = searchParams.get('q') || ''

  const offset = (page - 1) * limit

  // Build WHERE clauses
  const conditions = []
  const params = []

  if (role) {
    params.push(role)
    conditions.push(`u.role = $${params.length}`)
  }

  if (date) {
    params.push(date)
    conditions.push(`DATE(a.created_at AT TIME ZONE 'Asia/Jakarta') = $${params.length}::date`)
  }

  if (q) {
    params.push(`%${q}%`)
    conditions.push(`(a.description ILIKE $${params.length} OR a.action ILIKE $${params.length})`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    // Count total matching
    const countRes = await query(
      `SELECT COUNT(*) FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}`,
      params
    )
    const total = parseInt(countRes.rows[0].count, 10)

    // Fetch page data
    const logsParams = [...params, limit, offset]
    const logsRes = await query(
      `SELECT
         a.id,
         a.action,
         a.description,
         a.website_id,
         a.properties,
         a.ip_address,
         a.created_at,
         u.name  AS user_name,
         u.email AS user_email,
         u.role  AS user_role,
         w.name  AS website_name
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN websites w ON a.website_id = w.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${logsParams.length - 1} OFFSET $${logsParams.length}`,
      logsParams
    )

    const logs = logsRes.rows.map((r) => ({
      ...r,
      properties: r.properties || {},
    }))

    return NextResponse.json({ logs, total, page, limit })
  } catch (err) {
    console.error('Activities API Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
