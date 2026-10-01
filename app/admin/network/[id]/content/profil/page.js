import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import EditProfileForm from './EditProfileForm'

export async function generateMetadata({ params }) {
  const { id } = await params
  try {
    const res = await query('SELECT name FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
    const name = res.rows[0]?.name || 'Website'
    return { title: `Edit Konten: Profil - ${name}` }
  } catch {
    return { title: 'Edit Konten: Profil' }
  }
}

export default async function EditProfilePage({ params }) {
  const { id } = await params
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

  // 2. Ambil data profil wilayah dari tabel wilayah_profiles
  let profile = {}
  try {
    const profRes = await query(
      `SELECT * FROM wilayah_profiles WHERE website_id = $1 LIMIT 1`,
      [id]
    )
    if (profRes.rows.length > 0) {
      profile = profRes.rows[0]
    }
  } catch (err) {
    console.error('Error fetching wilayah_profiles:', err)
  }

  return (
    <div className="w-full">
      <EditProfileForm website={website} initialProfile={profile} />
    </div>
  )
}
