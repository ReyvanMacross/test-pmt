import Link from 'next/link'

const roleLabels = {
  'admin-dinas': 'Dinas / OPD',
  'admin-kecamatan': 'Kecamatan',
  'admin-kelurahan': 'Kelurahan',
}

function Metric({ label, value, hint, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    teal: 'bg-teal-50 text-teal-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  }
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><div className="mt-2 flex items-end justify-between gap-3"><strong className="text-3xl font-extrabold text-slate-900">{value}</strong><span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${tones[tone]}`}>{hint}</span></div></div>
}

export default function RoleDashboard({ user, website, filledModules, totalModules, activities, canViewAllLogs }) {
  const roleLabel = roleLabels[user.role] || 'Perangkat Daerah'
  const percent = totalModules ? Math.round((filledModules / totalModules) * 100) : 0

  return <div className="space-y-5">
    <header className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard Admin Konten <span className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 align-middle text-[11px] font-semibold text-blue-700">{website?.name || user.instansi || roleLabel}</span></h1>
        <p className="mt-1 text-xs text-slate-500">Ringkasan kelengkapan konten portal dan aktivitas website instansi Anda.</p>
      </div>
      <span className="text-xs text-slate-400">Diperbarui: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB</span>
    </header>

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Modul Terisi" value={`${filledModules} / ${totalModules}`} hint="Konten" />
      <Metric label="Perlu Dilengkapi" value={totalModules - filledModules} hint="Modul" tone="amber" />
      <Metric label="Website" value={website ? (website.status === 'active' ? 'Aktif' : 'Nonaktif') : 'Belum ada'} hint={roleLabel} tone="teal" />
      <Metric label="Kelengkapan" value={`${percent}%`} hint="Sinkron" tone="indigo" />
    </section>

    {!website ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="font-bold text-slate-900">Website instansi belum tersedia</h2>
      <p className="mt-1 text-sm text-slate-600">Minta Super Admin menugaskan website dengan template {roleLabel} agar Anda dapat mulai mengelola konten portal.</p>
    </section> : <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="font-bold text-slate-900">Pintasan Akses Utama</h2>
          <p className="mt-1 text-xs text-slate-500">Akses cepat pengelolaan portal {roleLabel.toLowerCase()}.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href={`/admin/network/${website.id}/content`} className="group rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-300 hover:bg-blue-50/40">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">✎</span><strong className="block text-sm text-slate-900 group-hover:text-blue-700">Kelola Konten</strong><p className="mt-1 text-xs leading-relaxed text-slate-500">Lengkapi profil, layanan, berita, dan informasi publik.</p><span className="mt-3 block text-xs font-semibold text-blue-700">Buka kelola konten →</span>
            </Link>
            <a href={`/${website.subdomain}`} target="_blank" rel="noreferrer" className="group rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-300 hover:bg-blue-50/40">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">↗</span><strong className="block text-sm text-slate-900 group-hover:text-blue-700">Pratinjau Website</strong><p className="mt-1 text-xs leading-relaxed text-slate-500">Lihat tampilan portal publik {website.name}.</p><span className="mt-3 block text-xs font-semibold text-blue-700">Kunjungi portal →</span>
            </a>
            <Link href="/admin/activities" className="group rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-300 hover:bg-blue-50/40">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">◷</span><strong className="block text-sm text-slate-900 group-hover:text-blue-700">Log Aktivitas</strong><p className="mt-1 text-xs leading-relaxed text-slate-500">Periksa perubahan konten dan riwayat akun Anda.</p><span className="mt-3 block text-xs font-semibold text-blue-700">Lihat log saya →</span>
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Informasi Sesi Login</h2><p className="mt-1 text-xs text-slate-500">Detail akun dan website yang ditugaskan.</p></div><span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{user.role}</span></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><span className="text-[10px] font-semibold uppercase text-slate-400">Nama Pengguna</span><p className="mt-1 text-sm font-semibold text-slate-900">{user.name}</p></div><div><span className="text-[10px] font-semibold uppercase text-slate-400">Email Resmi</span><p className="mt-1 break-all text-sm font-semibold text-slate-900">{user.email}</p></div><div><span className="text-[10px] font-semibold uppercase text-slate-400">Instansi</span><p className="mt-1 text-sm font-semibold text-slate-900">{user.instansi || website.name}</p></div><div><span className="text-[10px] font-semibold uppercase text-slate-400">Website Ditugaskan</span><p className="mt-1 text-sm font-semibold text-slate-900">{website.name} <span className="text-slate-500">(/{website.subdomain})</span></p></div></div>
        </div>
      </div>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3"><div><h2 className="font-bold text-slate-900">Aktivitas Terakhir</h2><p className="mt-1 text-xs text-slate-500">Aktivitas website ini</p></div><Link href="/admin/activities" className="text-xs font-semibold text-blue-700">{canViewAllLogs ? 'Semua log' : 'Lihat semua'} →</Link></div>
        {activities.length ? <div className="divide-y divide-slate-100">{activities.map((item) => <article key={item.id} className="space-y-1 py-3"><h3 className="text-sm font-semibold text-slate-900">{item.title}</h3><p className="text-xs leading-relaxed text-slate-600">{item.description || 'Aktivitas website tercatat.'}</p><time className="block text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB</time></article>)}</div> : <p className="py-8 text-center text-xs text-slate-500">Belum ada aktivitas tercatat.</p>}
      </aside>
    </section>}
  </div>
}
