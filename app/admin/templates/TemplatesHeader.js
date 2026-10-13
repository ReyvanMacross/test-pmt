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
    </div>
  )
}
