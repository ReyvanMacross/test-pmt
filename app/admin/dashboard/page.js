import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export const metadata = { title: 'Dashboard Multi-Tenant - Pemerintah Kota Bandung' }

// ─── Helper format waktu relatif ──────────────────────────────────────────────
function formatRelativeTime(isoString) {
  if (!isoString) return '-'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 30) return `${diffDays} hari yang lalu`
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Helper badge kategori aktivitas ──────────────────────────────────────────
function getActivityBadge(action) {
  if (!action) return { label: 'Sistem', cls: 'bg-slate-100 text-slate-700' }
  const act = action.toLowerCase()
  if (act.includes('create') || act.includes('deploy')) return { label: 'Deploy', cls: 'bg-emerald-50 text-emerald-700' }
  if (act.includes('update') || act.includes('content') || act.includes('edit')) return { label: 'Konten', cls: 'bg-blue-50 text-blue-700' }
  if (act.includes('delete') || act.includes('restore')) return { label: 'Website', cls: 'bg-rose-50 text-rose-700' }
  if (act.includes('login') || act.includes('auth') || act.includes('keamanan')) return { label: 'Keamanan', cls: 'bg-slate-100 text-slate-700' }
  return { label: 'Sistem', cls: 'bg-slate-100 text-slate-700' }
}

// ─── Helper judul aktivitas ───────────────────────────────────────────────────
function getActivityTitle(action) {
  const map = {
    create_website: 'Deploy Website',
    update_website: 'Pembaruan Website',
    delete_website: 'Hapus Website',
    restore_website: 'Pulihkan Website',
    permanent_delete_website: 'Hapus Permanen Website',
    update_content: 'Pembaruan Konten',
    login: 'Autentikasi Sistem',
  }
  return map[action] || action?.replace(/_/g, ' ') || 'Aktivitas Sistem'
}

// ─── Fallback demo activities jika log masih kosong ───────────────────────────
const demoActivities = [
  {
    id: 'demo-1',
    action: 'update_content',
    title: 'Pembaruan Konten',
    badge: { label: 'Konten', cls: 'bg-blue-50 text-blue-700' },
    description: 'Kecamatan Bojongloa Kidul: Menyunting informasi kontak resmi.',
    time: '12 menit yang lalu',
  },
  {
    id: 'demo-2',
    action: 'create_website',
    title: 'Deploy Website',
    badge: { label: 'Deploy', cls: 'bg-emerald-50 text-emerald-700' },
    description: 'Kecamatan Bojongloa Kidul: Inisialisasi tenant baru.',
    time: '2 hari yang lalu',
  },
  {
    id: 'demo-3',
    action: 'login',
    title: 'Autentikasi Sistem',
    badge: { label: 'Keamanan', cls: 'bg-slate-100 text-slate-700' },
    description: 'Login berhasil Super Admin dari IP Intranet.',
    time: 'Hari ini, 08:30 WIB',
  },
]

// ─── Page (Server Component) ──────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const isSuperAdmin = session.role === 'super-admin'

  // 1. Ambil data user terkini dari database
  let userInfo = {
    name: session.name || 'Super Admin Diskominfo',
    email: session.email || 'superadmin@diskominfo.go.id',
    role: session.role || 'super-admin',
  }

  try {
    const resUser = await query(
      'SELECT name, email, role FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
      [session.id]
    )
    if (resUser.rows.length > 0) {
      userInfo = {
        name: resUser.rows[0].name || userInfo.name,
        email: resUser.rows[0].email || userInfo.email,
        role: resUser.rows[0].role || userInfo.role,
      }
    }
  } catch (e) {
    console.error('Error fetching user info in dashboard:', e)
  }

  // 2. Query metrik dari database
  let totalWebsites = 0
  let activeWebsites = 0
  let totalTemplates = 0
  let totalAdmins = 0
  let dbActivities = []

  try {
    const userFilter = isSuperAdmin ? '' : ' AND w.user_id = $1'
    const metricParams = isSuperAdmin ? [] : [session.id]

    const [resTotal, resActive, resTpl] = await Promise.all([
      query(`SELECT COUNT(*) FROM websites w WHERE w.deleted_at IS NULL${userFilter}`, metricParams),
      query(`SELECT COUNT(*) FROM websites w WHERE w.status = 'active' AND w.deleted_at IS NULL${userFilter}`, metricParams),
      query('SELECT COUNT(*) FROM templates WHERE is_active = true'),
    ])

    totalWebsites = parseInt(resTotal.rows[0].count, 10)
    activeWebsites = parseInt(resActive.rows[0].count, 10)
    totalTemplates = parseInt(resTpl.rows[0].count, 10)

    if (isSuperAdmin) {
      const resAdmins = await query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL')
      totalAdmins = parseInt(resAdmins.rows[0].count, 10)

      const resLogs = await query(`
        SELECT a.id, a.action, a.description, a.created_at, u.name AS user_name, w.name AS website_name
        FROM activity_logs a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN websites w ON a.website_id = w.id
        ORDER BY a.created_at DESC
        LIMIT 5
      `)
      dbActivities = resLogs.rows
    } else {
      const resLogs = await query(`
        SELECT a.id, a.action, a.description, a.created_at, w.name AS website_name
        FROM activity_logs a
        LEFT JOIN websites w ON a.website_id = w.id
        WHERE a.user_id = $1
        ORDER BY a.created_at DESC
        LIMIT 5
      `, [session.id])
      dbActivities = resLogs.rows
    }
  } catch (err) {
    console.error('Dashboard Stats DB Error:', err)
  }

  // Format activities: jika DB kosong, gunakan demoActivities
  const activitiesToDisplay = dbActivities.length > 0
    ? dbActivities.map((log) => ({
        id: log.id,
        title: getActivityTitle(log.action),
        badge: getActivityBadge(log.action),
        description: log.description || `${log.website_name || 'Website'}: Aktivitas tercatat.`,
        time: formatRelativeTime(log.created_at),
      }))
    : demoActivities

  const updateTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6">

      {/* ── Header Title Card ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-slate-900 tracking-tight">
            Dashboard Multi-Tenant
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Selamat datang kembali, {isSuperAdmin ? 'Super Admin' : userInfo.name?.split(' ')[0]}. Ringkasan operasional dan status multisite Kota Bandung.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 self-start sm:self-auto">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span>Diperbarui: Hari ini, {updateTime} WIB</span>
        </div>
      </div>

      {/* ── Top Metrics Cards (4 Columns) ────────────────────────────── */}
      <section aria-labelledby="metrics-summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <h2 className="sr-only" id="metrics-summary">Ringkasan Metrik</h2>

        {/* Card 1: TOTAL WEBSITE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">TOTAL WEBSITE</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalWebsites}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </div>

        {/* Card 2: WEBSITE AKTIF */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">WEBSITE AKTIF</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{activeWebsites}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </div>

        {/* Card 3: TEMPLATE TERSEDIA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">TEMPLATE TERSEDIA</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalTemplates}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </div>

        {/* Card 4: TOTAL ADMINISTRATOR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {isSuperAdmin ? 'TOTAL ADMINISTRATOR' : 'WEBSITE SAYA'}
            </span>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {isSuperAdmin ? totalAdmins : totalWebsites}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* ── Main Grid Section (2:1 ratio) ────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pintasan Akses Utama */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div>
              <h2 className="font-bold text-base text-slate-900">Pintasan Akses Utama</h2>
              <p className="text-xs text-slate-500 mt-0.5">Akses cepat fungsi utama pengelolaan portal multi-tenant.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {/* Action Item 1: Deploy Website Baru */}
              <Link
                href="/admin/network"
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Deploy Website Baru
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Buat subdomain instan untuk instansi baru
                  </p>
                </div>
                <div className="flex items-center text-xs font-semibold text-blue-600 mt-4 group-hover:translate-x-0.5 transition-transform">
                  <span>Buka formulir</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
              </Link>

              {/* Action Item 2: Kelola Pengguna */}
              <Link
                href="/admin/users"
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Kelola Pengguna
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Atur hak akses dan akun operator OPD
                  </p>
                </div>
                <div className="flex items-center text-xs font-semibold text-blue-600 mt-4 group-hover:translate-x-0.5 transition-transform">
                  <span>Kelola akun</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
              </Link>

              {/* Action Item 3: Katalog Template */}
              <Link
                href="/admin/templates"
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Katalog Template
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Konfigurasi template Dinas &amp; Kecamatan
                  </p>
                </div>
                <div className="flex items-center text-xs font-semibold text-blue-600 mt-4 group-hover:translate-x-0.5 transition-transform">
                  <span>Lihat template</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          {/* Informasi Sesi Login */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div>
              <h2 className="font-bold text-base text-slate-900">Informasi Sesi Login</h2>
              <p className="text-xs text-slate-500 mt-0.5">Detail akun dan otorisasi sesi aktif.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-xs font-medium text-slate-500 block">Nama Pengguna</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{userInfo.name}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-xs font-medium text-slate-500 block">Email Resmi</span>
                <p className="text-sm font-bold text-slate-900 font-mono mt-1 text-xs break-all">{userInfo.email}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-xs font-medium text-slate-500 block">Peran / Hak Akses</span>
                <div className="mt-1">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    {userInfo.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-1) */}
        <div className="lg:col-span-1">
          {/* Aktivitas Terakhir */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base text-slate-900">Aktivitas Terakhir</h2>
                <p className="text-xs text-slate-500 mt-0.5">Audit log terkini sistem</p>
              </div>
              <Link
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                href="/admin/activities"
              >
                <span>Lihat Semua</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {activitiesToDisplay.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`space-y-1 ${idx === 0 ? 'pb-4 pt-2' : idx === activitiesToDisplay.length - 1 ? 'pt-4' : 'py-4'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${item.badge.cls}`}>
                      {item.badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  <span className="text-xs text-slate-400 block pt-0.5">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>
    </div>
  )
}
