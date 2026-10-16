export default function PublicPageHero({ eyebrow, title, description, links = [], children }) {
  return <header className="public-page-hero relative isolate overflow-hidden border-b border-white/10 px-5 py-14 text-center text-white sm:px-6 sm:py-16 lg:py-20">
    <div aria-hidden="true" className="public-page-hero__pattern pointer-events-none absolute inset-0" />
    <div className="relative mx-auto max-w-4xl">
      {eyebrow && <span className="inline-flex rounded-lg border border-teal-300/30 bg-teal-400/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-200 sm:text-xs">{eyebrow}</span>}
      <h1 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl">{title}</h1>
      {description && <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">{description}</p>}
      {children}
      {links.length > 0 && <nav aria-label="Navigasi bagian" className="mt-7 flex flex-wrap justify-center gap-3 text-xs font-bold">{links.map(({ label, href }) => <a key={href} href={href} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:border-teal-200/60 hover:bg-white/20">{label}</a>)}</nav>}
    </div>
  </header>
}
