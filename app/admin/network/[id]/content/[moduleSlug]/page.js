import { canManageWebsite } from '@/lib/website-access'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { CONTENT_MODULES } from '@/lib/content-modules'
import EditModuleContentForm from './EditModuleContentForm'
import PublicDocumentManager from './PublicDocumentManager'
import { getPublicDocumentsForAdmin } from '@/lib/public-documents'

const PUBLIC_DOCUMENT_MODULES = new Set([
  'ppid', 'ppid-utama', 'daftar-informasi-publik', 'daftar-informasi-dikecualikan',
  'informasi-wajib-berkala', 'informasi-tersedia-setiap-saat', 'informasi-serta-merta',
])
const REMOVED_MODULES = new Set(['permohonan-informasi-online', 'pengajuan-keberatan-online'])

export async function generateMetadata({ params }) {
  const { id, moduleSlug } = await params
  try {
    const res = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
    const websiteName = res.rows[0]?.name || 'Website'

    const meta = CONTENT_MODULES.find((m) => m.slug === moduleSlug)
    const title = meta ? meta.title : moduleSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    return { title: `Edit Konten: ${title} - ${websiteName}` }
  } catch {
    return { title: 'Edit Konten Halaman' }
  }
}

export default async function EditModuleContentPage({ params }) {
  const { id, moduleSlug } = await params
  if (REMOVED_MODULES.has(moduleSlug)) notFound()
  const session = await getSession()
  if (!session) redirect('/login')

  // 1. Ambil data website
  const wsRes = await query(
    `SELECT w.*, t.name AS template_name, t.slug AS template_slug
     FROM websites w
     LEFT JOIN templates t ON w.template_id = t.id
     WHERE w.id = $1 AND w.deleted_at IS NULL
     LIMIT 1`,
    [id]
  )

  if (wsRes.rows.length === 0) notFound()

  const website = wsRes.rows[0]

  // Otorisasi akses
  if (!(await canManageWebsite(session, website.id, website.user_id))) {
    redirect('/admin/network')
  }

  // 2. Cari metadata modul dari CONTENT_MODULES (atau fallback jika slug kustom)
  let moduleMeta = CONTENT_MODULES.find((m) => m.slug === moduleSlug)
  if (!moduleMeta) {
    moduleMeta = {
      slug: moduleSlug,
      title: moduleSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      category: 'berita',
      categoryLabel: 'Konten Website',
      actionType: 'Edit',
      description: `Pengaturan naskah halaman ${moduleSlug}.`,
    }
  }

  // 3. Ambil konten tersimpan dari tabel contents
  let initialContent = { title: '', body: '', images: [], files: [], metadata: {} }
  try {
    const contentRes = await query(
      `SELECT c.title, c.body, c.images, c.files, c.metadata, c.updated_at
       FROM contents c
       JOIN menu_items m ON c.menu_item_id = m.id
       WHERE c.website_id = $1 AND m.slug = $2
       LIMIT 1`,
      [id, moduleMeta.slug]
    )

    if (contentRes.rows.length > 0) {
      initialContent = {
        title: contentRes.rows[0].title || '',
        body: contentRes.rows[0].body || '',
        images: Array.isArray(contentRes.rows[0].images) ? contentRes.rows[0].images : [],
        files: Array.isArray(contentRes.rows[0].files) ? contentRes.rows[0].files : [],
        metadata: contentRes.rows[0].metadata && typeof contentRes.rows[0].metadata === 'object' ? contentRes.rows[0].metadata : {},
        updated_at: contentRes.rows[0].updated_at,
      }
    }
  } catch (err) {
    console.error('Error fetching module content:', err)
  }

  if (PUBLIC_DOCUMENT_MODULES.has(moduleMeta.slug)) {
    initialContent.documents = getPublicDocumentsForAdmin(initialContent)
    return <PublicDocumentManager website={website} moduleMeta={moduleMeta} initialContent={initialContent}/>
  }

  return (
    <div className="w-full">
      <EditModuleContentForm
        website={website}
        moduleMeta={moduleMeta}
        initialContent={initialContent}
      />
    </div>
  )
}
