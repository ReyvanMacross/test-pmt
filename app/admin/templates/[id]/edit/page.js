import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'
import EditTemplateForm from './EditTemplateForm'

export async function generateMetadata({ params }) {
  const { id } = await params
  const res = await query('SELECT name FROM templates WHERE id = $1 LIMIT 1', [id])
  const name = res.rows[0]?.name || 'Template'
  return { title: `Edit Template - ${name}` }
}

// Helper format tanggal Indonesia
function formatDateID(dateString) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Helper format relatif
function formatRelativeTime(dateString) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Hari ini'
  if (diffDays === 1) return '1 hari yang lalu'
  if (diffDays < 30) return `${diffDays} hari yang lalu`
  return formatDateID(dateString)
}

export default async function EditTemplatePage({ params }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const access = await getCurrentAdminAccess()
  if (!hasAdminPermission(access, 'manage-templates')) redirect('/admin/dashboard')

  const res = await query(
    `SELECT t.*,
            COUNT(w.id) FILTER (WHERE w.deleted_at IS NULL) as usage_count
     FROM templates t
     LEFT JOIN websites w ON t.id = w.template_id
     WHERE t.id = $1
     GROUP BY t.id
     LIMIT 1`,
    [id]
  )

  if (res.rows.length === 0) notFound()

  const template = res.rows[0]
  const usageCount = parseInt(template.usage_count || 0, 10)

  return (
    <div className="flex flex-col w-full">
      {/* ── Page Title Card ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">Edit Template</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">{template.name}</p>
        </div>
        <div>
          <Link
            href="/admin/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali</span>
          </Link>
        </div>
      </div>

      {/* ── Main Content Grid (3/4 + 1/4 ratio) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Form Card (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Informasi Template</h2>
          </div>

          <EditTemplateForm template={template} usageCount={usageCount} />
        </div>

        {/* Right Info Sidebar (lg:col-span-1) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Info Template Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 leading-none">Info Template</h3>
            </div>

            {/* Item 1: SLUG */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SLUG</span>
              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md inline-block font-semibold mt-1">
                {template.slug}
              </span>
            </div>

            {/* Item 2: DIPAKAI OLEH */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DIPAKAI OLEH</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 leading-none">{usageCount}</span>
                <span className="text-xs font-medium text-slate-500">website</span>
              </div>
            </div>

            {/* Item 3: DIBUAT */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DIBUAT</span>
              <p className="text-xs font-medium text-slate-700 mt-0.5">{formatDateID(template.created_at)}</p>
            </div>

            {/* Item 4: TERAKHIR DIPERBARUI */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TERAKHIR DIPERBARUI</span>
              <p className="text-xs font-medium text-slate-700 mt-0.5">{formatRelativeTime(template.updated_at)}</p>
            </div>
          </div>

          {/* Notice Card */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
            {usageCount > 0
              ? `Template dipakai oleh ${usageCount} website aktif. Penghapusan template hanya dapat dilakukan jika tidak ada website yang menggunakannya.`
              : 'Template saat ini tidak dipakai oleh website aktif mana pun dan aman untuk dihapus atau dikonfigurasi ulang.'}
          </div>
        </div>
      </div>
    </div>
  )
}
