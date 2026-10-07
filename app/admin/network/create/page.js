import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import CreateWebsiteForm from './CreateWebsiteForm'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'

export const metadata = { title: 'Tambah Website Baru - Network Admin' }

export default async function CreateWebsitePage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!hasAdminPermission(access, 'manage-all-websites') && !hasAdminPermission(access, 'manage-assigned-website')) redirect('/admin/dashboard')
  if ((access?.role || session.role) !== 'super-admin') redirect('/admin/network')

  // Ambil daftar template aktif dari PostgreSQL
  const res = await query('SELECT id, name, slug, description FROM templates WHERE is_active = true ORDER BY id ASC')
  const accountRole = access?.role || session.role
  const allowedTemplate = { 'admin-dinas': 'dinas', 'admin-kecamatan': 'kecamatan', 'admin-kelurahan': 'kelurahan' }[accountRole]
  const templates = accountRole === 'super-admin' ? res.rows : res.rows.filter((template) => template.slug === allowedTemplate)
  if (!templates.length) redirect('/admin/network')

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* ── Breadcrumb & Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/admin/network"
          style={{
            fontSize: '13px',
            color: '#2563EB',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Kembali ke Daftar Website
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
          Tambah Website Perangkat Daerah Baru
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
          Daftarkan website baru untuk Dinas, Kecamatan, atau Kelurahan di lingkungan Pemerintah Kota Bandung
        </p>
      </div>

      {/* ── Card Form ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <CreateWebsiteForm templates={templates} />
      </div>
    </div>
  )
}
