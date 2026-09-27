import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import EditWebsiteForm from './EditWebsiteForm'

export const metadata = { title: 'Edit Website - Network Admin' }

export default async function EditWebsitePage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  // Ambil data website
  const res = await query(
    'SELECT * FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [id]
  )

  if (res.rows.length === 0) {
    notFound()
  }

  const website = res.rows[0]

  // Cek otorisasi
  if (session.role !== 'super-admin' && website.user_id !== session.id) {
    redirect('/admin/network')
  }

  // Ambil data templates
  const tplRes = await query('SELECT id, name, slug, description FROM templates WHERE is_active = true ORDER BY id ASC')
  const templates = tplRes.rows

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
          Edit Website: {website.name}
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
          Perbarui status, template, atau informasi subdomain website ini
        </p>
      </div>

      {/* ── Card Form ───────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <EditWebsiteForm website={website} templates={templates} />
      </div>
    </div>
  )
}
