import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { CONTENT_MODULES } from '@/lib/content-modules'
import EditModuleContentForm from './EditModuleContentForm'

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
  if (session.role !== 'super-admin' && website.user_id !== session.id) {
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
  let initialContent = { title: '', body: '', images: [], files: [] }
  try {
    const contentRes = await query(
      `SELECT c.title, c.body, c.images, c.files
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
      }
    }
  } catch (err) {
    console.error('Error fetching module content:', err)
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
