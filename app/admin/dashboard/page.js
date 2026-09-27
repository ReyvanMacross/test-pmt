import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export const metadata = { title: 'Dashboard' }

// ─── Helper komponen StatCard ─────────────────────────────────────────────────
function StatCard({ title, value, iconBg, icon }) {
  return (
    <div style={{
      background: '#fff',
      padding: '20px 24px',
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div>
        <h3 style={{
          fontSize: '12px', color: '#6B7280', marginBottom: '6px',
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {title}
        </h3>
        <p style={{ fontSize: '32px', fontWeight: 700, color: '#1F2937', lineHeight: 1 }}>
          {value ?? 0}
        </p>
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: '8px',
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
    </div>
  )
}

// ─── Helper badge role ─────────────────────────────────────────────────────────
const roleBadgeStyle = {
  'super-admin':      { bg: '#FEF3C7', color: '#92400E' },
  'admin-dinas':      { bg: '#DBEAFE', color: '#1E40AF' },
  'admin-kecamatan':  { bg: '#CFFAFE', color: '#155E75' },
  'admin-kelurahan':  { bg: '#D1FAE5', color: '#065F46' },
}

// ─── Helper format tanggal Indonesia ─────────────────────────────────────────
function formatDateID(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Page (Server Component) ──────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const isSuperAdmin = session.role === 'super-admin'

  // ── Query statistik dari PostgreSQL lokal ──────────────────────────────────
  let totalWebsites = 0
  let activeWebsites = 0
  let totalUsers = null
  let totalTemplates = 0
  let recentActivities = []

  try {
    if (isSuperAdmin) {
      const [resTotalWs, resActiveWs, resUsers] = await Promise.all([
        query('SELECT COUNT(*) FROM websites WHERE deleted_at IS NULL'),
        query("SELECT COUNT(*) FROM websites WHERE status = 'active' AND deleted_at IS NULL"),
        query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'),
      ])
      totalWebsites  = parseInt(resTotalWs.rows[0].count, 10)
      activeWebsites = parseInt(resActiveWs.rows[0].count, 10)
      totalUsers     = parseInt(resUsers.rows[0].count, 10)
    } else {
      const [resTotalWs, resActiveWs] = await Promise.all([
        query('SELECT COUNT(*) FROM websites WHERE user_id = $1 AND deleted_at IS NULL', [session.id]),
        query("SELECT COUNT(*) FROM websites WHERE user_id = $1 AND status = 'active' AND deleted_at IS NULL", [session.id]),
      ])
      totalWebsites  = parseInt(resTotalWs.rows[0].count, 10)
      activeWebsites = parseInt(resActiveWs.rows[0].count, 10)
    }

    // Hitung templates aktif
    const resTpl = await query('SELECT COUNT(*) FROM templates WHERE is_active = true')
    totalTemplates = parseInt(resTpl.rows[0].count, 10)

    // Activity log untuk super admin
    if (isSuperAdmin) {
      const resLogs = await query(`
        SELECT a.id, a.action, a.description, a.created_at, u.name as user_name
        FROM activity_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 5
      `)
      recentActivities = resLogs.rows
    }
  } catch (err) {
    console.error('Dashboard Stats Error:', err)
  }

  const badge = roleBadgeStyle[session.role] ?? roleBadgeStyle['admin-kelurahan']

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
          Dashboard Admin
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          Selamat datang di panel admin Multisite Diskominfo
        </p>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <StatCard
          title="Total Website"
          value={totalWebsites}
          iconBg="#DBEAFE"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 3c-3.5 5-3.5 13 0 18M12 3c3.5 5 3.5 13 0 18"/>
              <path d="M3 12h18"/>
            </svg>
          }
        />
        <StatCard
          title="Website Aktif"
          value={activeWebsites}
          iconBg="#D1FAE5"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          }
        />
        <StatCard
          title="Template Tersedia"
          value={totalTemplates}
          iconBg="#CFFAFE"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          }
        />
        {isSuperAdmin && (
          <StatCard
            title="Total User"
            value={totalUsers}
            iconBg="#FEF3C7"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            }
          />
        )}
      </div>

      {/* ── Account Info Card ───────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', marginBottom: '20px' }}>
          Your Account Info
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div>
            <p style={{ marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
              <strong>Name:</strong> {session.name ?? '-'}
            </p>
            <p style={{ marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
              <strong>Email:</strong> {session.email}
            </p>
            <p style={{ fontSize: '14px', color: '#374151' }}>
              <strong>Role:</strong>{' '}
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                background: badge.bg,
                color: badge.color,
              }}>
                {session.role ?? 'admin-kelurahan'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Recent Activities (super-admin only) ─────────────────────────── */}
      {isSuperAdmin && (
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
              Recent Activities
            </h2>
            <a
              href="/admin/activities"
              style={{
                background: '#2563EB', color: '#fff', padding: '8px 16px',
                borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
              }}
            >
              View All
            </a>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Time', 'User', 'Activity'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px', fontSize: '12px',
                    fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '14px' }}>
                    No recent activities
                  </td>
                </tr>
              ) : (
                recentActivities.map(log => (
                  <tr key={log.id}>
                    <td style={{ padding: '16px 12px', fontSize: '13px', color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
                      {formatDateID(log.created_at)}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                      {log.user_name ?? <span style={{ color: '#9CA3AF' }}>System</span>}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                      {log.description ?? log.action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
