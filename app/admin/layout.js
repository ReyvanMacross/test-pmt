import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Sidebar from './_components/Sidebar'

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
      'SELECT id, name, email, role FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
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
    <div className={`${jakarta.className} bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col`}>
      <div className="flex h-screen overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <Sidebar userRole={userRole} />

        {/* ── Main Content Wrapper ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
          {/* Top Header */}
          <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs flex-shrink-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center text-slate-400">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span className="hover:text-slate-600">Portal Multi-Tenant</span>
              </div>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-800">Manajemen Website</span>
            </div>

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

          {/* Scrollable Main Area */}
          <main className="flex-1 overflow-y-auto p-8 space-y-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
