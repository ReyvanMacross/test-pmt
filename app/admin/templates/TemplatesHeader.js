import Link from 'next/link'

export default function TemplatesHeader() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Template Website</h2>
        <p className="text-xs text-slate-500 mt-1">
          Kelola status, konfigurasi, dan ketersediaan template website instansi Kota Bandung.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href="/admin/templates/create"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Template</span>
        </Link>
      </div>
    </div>
  )
}
