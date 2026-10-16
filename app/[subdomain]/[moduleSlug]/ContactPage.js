import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Clock3, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'

function FacebookMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M13.5 21v-7.2h2.4l.4-2.8h-2.8V9.2c0-.8.3-1.4 1.4-1.4h1.5V5.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H7.7v2.8h2.5V21h3.3Z"/></svg>
}

function InstagramMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.8" r=".8" fill="currentColor" stroke="none"/></svg>
}

function YoutubeMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/></svg>
}

function cleanPhone(value) {
  return String(value || '').replace(/[^\d+]/g, '')
}

function whatsappHref(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  else if (digits.startsWith('8')) digits = `62${digits}`
  return digits ? `https://wa.me/${digits}` : ''
}

function socialHref(value, base) {
  if (!value) return ''
  const text = String(value).trim()
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${base}/${text.replace(/^@/, '')}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch { return '' }
}

function getMapEmbed(profile) {
  const candidate = profile?.maps_embed_url || profile?.google_maps_url
  if (!candidate) return ''
  try {
    const url = new URL(candidate)
    if (!['google.com', 'www.google.com', 'maps.google.com'].includes(url.hostname)) return ''
    if (url.pathname.startsWith('/maps/embed')) return url.toString()
    const query = url.searchParams.get('q') || url.searchParams.get('query') || profile?.contact_address
    if (query) return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
  } catch { return '' }
  return ''
}

function getDirectionsHref(profile) {
  const candidates = [profile?.google_maps_url, profile?.maps_embed_url].filter(Boolean)
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate)
      if (!['http:', 'https:'].includes(url.protocol)) continue
      if (url.hostname === 'maps.app.goo.gl' || url.hostname === 'goo.gl') return url.toString()
      if (!['google.com', 'www.google.com', 'maps.google.com'].includes(url.hostname)) continue

      // Embed links only work inside an iframe. Convert them to a regular
      // directions URL so Google Maps does not show its iframe-only warning.
      if (url.pathname.startsWith('/maps/embed')) {
        const query = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('destination')
        const coordinates = decodeURIComponent(candidate).match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
        const destination = query || (coordinates ? `${coordinates[1]},${coordinates[2]}` : profile?.contact_address)
        if (destination) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
        continue
      }
      if (url.pathname.startsWith('/maps')) return url.toString()
    } catch { /* Use the office address for directions when the saved URL is incomplete. */ }
  }
  return profile?.contact_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.contact_address)}` : ''
}

function ContactCard({ icon: Icon, tone, title, children, footer }) {
  return <article className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
    <div className="space-y-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5"/></span><h2 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h2><div className="text-xs leading-relaxed text-slate-500">{children}</div></div>
    {footer && <div className="border-t border-slate-100 pt-3">{footer}</div>}
  </article>
}

export default function ContactPage({ portal }) {
  const { website, profile, moduleVisibility = {} } = portal
  const address = profile?.contact_address?.trim()
  const hours = profile?.operating_hours?.trim()
  const officePhone = profile?.office_phone?.trim()
  const whatsapp = profile?.whatsapp_phone?.trim()
  const whatsappLink = whatsappHref(whatsapp)
  const email = profile?.official_email?.trim()
  const mapEmbed = getMapEmbed(profile)
  const directionsHref = getDirectionsHref(profile)
  const serviceEnabled = moduleVisibility.layanan !== false
  const instagram = socialHref(profile?.instagram_username, 'instagram.com')
  const facebook = socialHref(profile?.facebook_page_name, 'facebook.com')
  const youtube = socialHref(profile?.youtube_channel_url, 'youtube.com')
  const hasSocial = instagram || facebook || youtube

  return <>
    <main className="mx-auto w-full max-w-[1240px] space-y-7 px-4 py-8 sm:px-6 sm:py-10 lg:space-y-8 lg:px-8 lg:py-12">
      <section aria-label="Informasi kontak utama" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <ContactCard icon={MapPin} tone="bg-teal-50 text-teal-600" title="Alamat Lengkap Kantor" footer={directionsHref ? <a href={directionsHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800">Petunjuk Arah <ArrowUpRight className="h-3.5 w-3.5"/></a> : <span className="text-[11px] text-slate-400">Petunjuk arah belum tersedia.</span>}>
          <p className="whitespace-pre-line">{address || 'Alamat kantor belum ditambahkan.'}</p>
        </ContactCard>

        <ContactCard icon={Clock3} tone="bg-blue-50 text-blue-600" title="Jam Operasional Pelayanan" footer={<span className="text-[11px] text-slate-400">Pelayanan tatap muka &amp; administrasi</span>}>
          <p className="whitespace-pre-line">{hours || 'Jam pelayanan belum ditambahkan.'}</p>
        </ContactCard>

        <ContactCard icon={Phone} tone="bg-emerald-50 text-emerald-600" title="Telepon & WhatsApp Hotline" footer={whatsappLink ? <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800">Chat WhatsApp Hotline <ArrowUpRight className="h-3.5 w-3.5"/></a> : <span className="text-[11px] text-slate-400">Nomor WhatsApp belum tersedia.</span>}>
          <div className="space-y-1.5">{officePhone ? <p><strong className="text-slate-700">Telepon Kantor:</strong> <a href={`tel:${cleanPhone(officePhone)}`} className="break-words hover:text-teal-700">{officePhone}</a></p> : <p>Telepon kantor belum ditambahkan.</p>}{whatsapp && <p><strong className="text-slate-700">WhatsApp:</strong> {whatsappLink ? <a href={whatsappLink} target="_blank" rel="noreferrer" className="break-words hover:text-teal-700">{whatsapp}</a> : whatsapp}</p>}</div>
        </ContactCard>

        <ContactCard icon={Mail} tone="bg-violet-50 text-violet-600" title="Email & Media Sosial" footer={hasSocial ? <div className="flex flex-wrap items-center gap-2">{instagram && <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram resmi" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"><InstagramMark/></a>}{facebook && <a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook resmi" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"><FacebookMark/></a>}{youtube && <a href={youtube} target="_blank" rel="noreferrer" aria-label="YouTube resmi" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"><YoutubeMark/></a>}</div> : <span className="text-[11px] text-slate-400">Media sosial belum ditambahkan.</span>}>
          {email ? <a href={`mailto:${email}`} className="break-all font-mono text-[11px] text-slate-600 hover:text-teal-700">{email}</a> : <p>Email resmi belum ditambahkan.</p>}
        </ContactCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-bold text-slate-900 sm:text-lg">Lokasi Kantor {website.name}</h2><p className="mt-1 text-xs text-slate-500">Peta dan petunjuk arah menuju kantor kecamatan.</p></div><span className="rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-600">Google Maps</span></div>
          <div className="min-h-[250px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:min-h-[320px]">
            {mapEmbed ? <iframe title={`Peta lokasi ${website.name}`} src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="h-[280px] w-full border-0 sm:h-[340px]"/> : <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center sm:min-h-[320px]"><MapPin className="h-8 w-8 text-teal-600"/><p className="mt-3 max-w-md whitespace-pre-line text-sm font-semibold text-slate-700">{address || 'Peta lokasi kantor belum ditambahkan.'}</p><p className="mt-1 text-xs text-slate-500">Tambahkan tautan peta melalui Kelola Konten &gt; Profil atau Kontak.</p></div>}
          </div>
          {directionsHref && <a href={directionsHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"><MapPin className="h-4 w-4"/>Buka di Maps <ArrowUpRight className="h-3.5 w-3.5"/></a>}
        </article>

        <aside className="relative flex min-w-0 flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#06141D] to-[#0B2535] p-6 text-white shadow-md sm:p-8 lg:col-span-5">
          <div aria-hidden="true" className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"/>
          <div className="relative space-y-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-400/30 bg-teal-500/20 text-teal-300"><ShieldCheck className="h-5 w-5"/></span>
            <h2 className="text-xl font-extrabold leading-snug sm:text-2xl">Layanan Publik &amp; Informasi Warga</h2>
            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">Temukan prosedur layanan administrasi, persyaratan berkas, dan informasi publik resmi {website.name}.</p>
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-teal-300"><ShieldCheck className="h-4 w-4"/>Kanal Terpadu Layanan Online</p>
              <p className="text-[11px] leading-relaxed text-slate-300">Akses katalog layanan dan informasi publik yang dikelola melalui modul portal resmi.</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-xs font-semibold">{serviceEnabled && <Link href={`/${website.subdomain}/layanan`} className="text-teal-200 hover:text-white">Katalog layanan <ArrowUpRight className="inline h-3.5 w-3.5"/></Link>}</div>
            </div>
          </div>
          {serviceEnabled && <div className="relative border-t border-white/10 pt-4"><Link href={`/${website.subdomain}/layanan`} className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-center text-xs font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-500 sm:text-sm">Menuju Halaman Layanan Publik <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></Link></div>}
        </aside>
      </section>
    </main>
  </>
}
