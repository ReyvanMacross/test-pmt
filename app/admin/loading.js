export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6 p-4 sm:p-6 lg:p-8">
      <span className="sr-only">Memuat halaman admin...</span>
      <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="grid gap-5 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  )
}
