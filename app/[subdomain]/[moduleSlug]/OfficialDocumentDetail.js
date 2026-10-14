import Link from 'next/link'
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, ExternalLink, FileText } from 'lucide-react'
import { plainContent } from '@/lib/public-kecamatan'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

export default function OfficialDocumentDetail({ website, module, content }) {
  const attachments = [
    ...(Array.isArray(content?.files) ? content.files : []),
    ...(Array.isArray(content?.images) ? content.images : []),
  ].filter((file) => file?.url || file?.path)
  const externalUrl = content?.metadata?.external_url
  const description = plainContent(content?.body || '')

  return <main className="mx-auto w-full max-w-[1120px] space-y-5 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
    <Link href={`/${website.subdomain}/ppid`} className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900"><ArrowLeft className="h-4 w-4"/>Kembali ke Dokumen Resmi</Link>
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
      <header className="border-b border-slate-100 bg-white p-5 sm:p-7 lg:p-8"><span className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-teal-700"><FileText className="h-3.5 w-3.5"/>{module.title}</span><h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">{content?.title || module.title}</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">{module.description}</p>{content?.updated_at && <p className="mt-4 text-[10px] font-semibold text-slate-400">Terakhir diperbarui {formatDate(content.updated_at)}</p>}</header>
      <div className="space-y-6 p-5 sm:p-7 lg:p-8">
        {description ? <div className="whitespace-pre-line text-sm leading-7 text-slate-600">{description}</div> : <p className="text-sm text-slate-500">Rincian informasi belum ditambahkan.</p>}
        {attachments.length > 0 && <section className="space-y-3"><h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Berkas &amp; Lampiran</h2><div className="grid gap-3 sm:grid-cols-2">{attachments.map((file, index) => <a key={`${file.url || file.path}-${index}`} href={file.url || file.path} target="_blank" rel="noreferrer" download={file.name || undefined} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700"><FileText className="h-5 w-5"/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-800">{file.name || `Berkas ${index + 1}`}</strong><span className="mt-0.5 block text-[10px] text-slate-500">{file.type || 'Berkas publik'}</span></span><ArrowDownToLine className="h-4 w-4 shrink-0 text-teal-700"/></a>)}</div></section>}
        {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800 transition hover:bg-violet-100">Buka layanan / portal terkait <ExternalLink className="h-4 w-4"/></a>}
        {!description && !attachments.length && !externalUrl && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500">Belum ada rincian atau berkas untuk informasi ini. Silakan hubungi PPID instansi.</p>}
      </div>
    </article>
    {externalUrl && <p className="flex items-center gap-2 text-xs text-slate-500"><ArrowUpRight className="h-4 w-4 text-teal-700"/>Tautan eksternal akan dibuka di tab baru.</p>}
  </main>
}
