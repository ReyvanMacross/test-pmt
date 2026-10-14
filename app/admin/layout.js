import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Sidebar from './_components/Sidebar'
import Breadcrumb from './_components/Breadcrumb'
import AdminMain from './_components/AdminMain'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata = {
  title: {
    template: '%s - Manajemen Website Perangkat Daerah',
    default: 'Manajemen Website Perangkat Daerah - Pemerintah Kota Bandung',
  },
}

const roleNames = {
  'super-admin': 'Super Administrator',
  'admin-dinas': 'Admin Dinas',
  'admin-kecamatan': 'Admin Kecamatan',
  'admin-kelurahan': 'Admin Kelurahan',
}

function getInitials(name) {
  if (!name) return 'AD'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default async function AdminLayout({ children }) {
  // ── Ambil sesi login dari JWT cookie ────────────────────────────────────────
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  // ── Ambil data user terkini dari tabel PostgreSQL users ────────────────────
  let user = session
  try {
    const res = await query(
      'SELECT id, name, email, role, permissions FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
      [session.id]
    )
    if (res.rows.length > 0) {
      user = res.rows[0]
    }
  } catch (e) {
    console.error('Error fetching user profile:', e)
  }

  const userRole = user.role ?? 'admin-kelurahan'
  const userName = user.name ?? user.email
  const initials = getInitials(userName)
  const roleLabel = roleNames[userRole] ?? 'Administrator'

  return (
    <div className={`${jakarta.className} min-h-screen w-full bg-slate-50 text-slate-800 antialiased`}>
      <div className="flex min-h-screen items-start">
        <div className="sticky top-0 h-screen shrink-0">
          <Sidebar userRole={userRole} permissions={user.permissions || []} />
        </div>

        <div className="min-h-screen min-w-0 flex-1 bg-slate-50">
          <header className="sticky top-0 z-20 flex h-16 min-w-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs sm:px-8">
            {/* Breadcrumbs — dynamic */}
            <Breadcrumb />

            {/* User Profile Pill */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-100 flex-shrink-0">
                  {initials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Keep page scrolling on the document so route changes cannot hide the app chrome. */}
          <AdminMain>{children}</AdminMain>
        </div>
      </div>
    </div>
  )
}
