import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import EditWebsiteForm from './EditWebsiteForm'
import DeleteWebsiteButton from './DeleteWebsiteButton'

export async function generateMetadata({ params }) {
  const { id } = await params
  const res = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
  const name = res.rows[0]?.name || 'Website'
  return { title: `Edit ${name} - Manajemen Website` }
}

export default async function EditWebsitePage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  // Ambil data website beserta template & owner
  const res = await query(
    `SELECT w.*, t.name AS template_name, t.slug AS template_slug, u.name AS owner_name
     FROM websites w
     LEFT JOIN templates t ON w.template_id = t.id
     LEFT JOIN users u ON w.user_id = u.id
     WHERE w.id = $1 AND w.deleted_at IS NULL
     LIMIT 1`,
    [id]
  )

  if (res.rows.length === 0) notFound()

  const website = res.rows[0]

  // Otorisasi
  if (session.role !== 'super-admin' && website.user_id !== session.id) {
    redirect('/admin/network')
  }

  // Ambil semua template aktif
  const tplRes = await query(
    'SELECT id, name, slug, description FROM templates WHERE is_active = true ORDER BY id ASC'
  )
  const templates = tplRes.rows

  // Format tanggal
  const createdAt = website.created_at
    ? new Date(website.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-'

  const updatedAt = website.updated_at
    ? new Date(website.updated_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-'

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Edit Website
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-semibold text-blue-600">{website.name}</span>
            <span className="mx-2 text-slate-300">—</span>
            <span className="font-mono text-xs text-slate-400">
              bandung.go.id/{website.subdomain}
            </span>
          </p>
        </div>
        <Link
          href="/admin/network"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold transition-all shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </Link>
      </div>

      {/* ── 2-Column Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Kolom Kiri: Form Informasi Website ────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">Informasi Website</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Perbarui identitas, nama instansi, subdomain, dan pengaturan template website tenant.
              </p>
            </div>
            <EditWebsiteForm
              website={website}
              templates={templates}
            />
          </div>
        </div>

        {/* ── Kolom Kanan: Sidebar Info & Aksi ──────────────── */}
        <div className="space-y-5">

          {/* STATUS WEBSITE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Status Website
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Status</span>
                {website.status === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    Active
                  </span>
                ) : website.status === 'inactive' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                    Inactive
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                    Suspended
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">URL</span>
                <a
                  href={`https://bandung.go.id/${website.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-blue-600 hover:underline"
                >
                  /{website.subdomain}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Template</span>
                <span className="text-xs font-semibold text-slate-700">{website.template_name || '-'}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Dibuat</span>
                  <span className="text-xs text-slate-600">{createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Terakhir Diperbarui</span>
                  <span className="text-xs text-slate-600">{updatedAt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AKSI CEPAT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Aksi Cepat
            </h3>
            <div className="space-y-2">
              <Link
                href={`/admin/network/${website.id}/content`}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-sm font-semibold text-slate-700 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Kelola Konten
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href={`/${website.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-sm font-semibold text-slate-700 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Buka Website
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* ZONA BERBAHAYA */}
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Zona Berbahaya
            </h3>
            <p className="text-xs text-rose-500 mb-4 leading-relaxed">
              Tindakan ini akan memindahkan website ke folder Sampah. Seluruh konten dan pengaturan akan dinonaktifkan.
            </p>
            <DeleteWebsiteButton websiteId={website.id} websiteName={website.name} />
          </div>

        </div>
      </div>
    </div>
  )
}
