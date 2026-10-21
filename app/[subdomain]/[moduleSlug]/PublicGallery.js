'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Play, X } from 'lucide-react'

function formatDate(value) {
  if (!value) return ''
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function getYoutubeId(value) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^(?:www|m)\./, '')
    const isYoutubeHost = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com')
    const youtubeId = host === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : isYoutubeHost
        ? url.searchParams.get('v') || url.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1]
        : null
    return youtubeId && /^[\w-]{6,20}$/.test(youtubeId) ? youtubeId : null
  } catch {
    return null
  }
}

function getEmbedUrl(value) {
  const youtubeId = getYoutubeId(value)
  if (youtubeId) return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`

  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^(?:www|m)\./, '')

    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      const id = url.pathname.match(/\/video\/(\d+)/)?.[1]
      if (id) return `https://www.tiktok.com/embed/v2/${id}`
    }
    if (host === 'instagram.com') {
      const match = url.pathname.match(/\/(?:reel|reels|p|tv)\/([\w-]+)/)
      if (match) {
        const kind = url.pathname.match(/^\/(reel|reels|p|tv)\//)?.[1]
        const route = kind === 'p' ? 'p' : kind === 'tv' ? 'tv' : 'reel'
        return `https://www.instagram.com/${route}/${match[1]}/embed`
      }
    }
    if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch') {
      const validFacebookPath = host === 'fb.watch'
        ? /^\/[\w-]+\/?$/.test(url.pathname)
        : /^\/(?:watch(?:\/|\?|$)|reel\/|share\/[vrs]\/|[^/]+\/videos\/)/i.test(`${url.pathname}${url.search}`)
      if (validFacebookPath) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false&width=900`
    }
    if (host === 'x.com' || host === 'twitter.com' || host.endsWith('.x.com') || host.endsWith('.twitter.com')) {
      const id = url.pathname.match(/\/status\/(\d+)/)?.[1]
      if (id) return `https://platform.twitter.com/embed/Tweet.html?id=${id}`
    }
  } catch {}
  return null
}

function getYoutubeThumbnail(value) {
  const id = getYoutubeId(value)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function isExternalVideo(item) {
  return item.type === 'youtube' || (/^https?:\/\//i.test(item.path || '') && !item.path.includes('/storage/v1/object/public/'))
}

export default function PublicGallery({ albums, type }) {
  const [selection, setSelection] = useState(null)
  const selectedAlbum = selection ? albums[selection.albumIndex] : null
  const selectedItem = selection ? selectedAlbum?.items?.[selection.itemIndex] : null
  const embedUrl = selectedItem && isExternalVideo(selectedItem) ? getEmbedUrl(selectedItem.path) : null
  useEffect(() => {
    if (!selection) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event) {
      if (event.key === 'Escape') setSelection(null)
      if (event.key === 'ArrowLeft') setSelection((current) => current && ({ ...current, itemIndex: Math.max(0, current.itemIndex - 1) }))
      if (event.key === 'ArrowRight') setSelection((current) => current && ({ ...current, itemIndex: Math.min((albums[current.albumIndex]?.items?.length || 1) - 1, current.itemIndex + 1) }))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selection, albums])

  function openItem(albumIndex, itemIndex) {
    setSelection({ albumIndex, itemIndex })
  }

  function moveItem(direction) {
    setSelection((current) => {
      if (!current) return current
      const count = albums[current.albumIndex]?.items?.length || 0
      const next = current.itemIndex + direction
      return next >= 0 && next < count ? { ...current, itemIndex: next } : current
    })
  }

  return <div className="space-y-8">
    {albums.length ? albums.map((album, albumIndex) => <section key={album.id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3"><div><h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{album.title}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{formatDate(album.album_date)}<span className="px-1 text-slate-300">·</span>{album.items.length} {type === 'image' ? 'foto' : 'video'}</p></div></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {album.items.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => openItem(albumIndex, itemIndex)} aria-label={`Perbesar ${item.name || (type === 'image' ? 'foto' : 'video')}`} className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
          <span className={`relative block overflow-hidden bg-slate-950 ${type === 'image' ? 'aspect-[4/3]' : 'aspect-video'}`}>
            {type === 'image' ? <img src={item.path} alt={item.name || ''} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : isExternalVideo(item) ? <><span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><Play className="h-10 w-10" /></span>{getYoutubeThumbnail(item.path) && <img src={getYoutubeThumbnail(item.path)} alt={item.name ? `Thumbnail: ${item.name}` : 'Thumbnail video YouTube'} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} className="absolute inset-0 h-full w-full object-cover" />}</> : <video src={item.path} preload="metadata" className="h-full w-full object-cover" />}
            {type === 'video' && <span className="absolute inset-0 flex items-center justify-center bg-slate-950/10 transition group-hover:bg-slate-950/30"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-teal-700 shadow-lg"><Play className="ml-0.5 h-5 w-5 fill-current" /></span></span>}
          </span>
          <span className="block p-4"><span className="block truncate text-sm font-bold text-slate-900">{item.name || (type === 'image' ? 'Dokumentasi foto' : 'Dokumentasi video')}</span>{item.description && <span className="mt-1.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">{item.description}</span>}<span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-700">{type === 'image' ? 'Lihat foto' : 'Putar video'}<span aria-hidden="true">↗</span></span></span>
        </button>)}
      </div>
    </section>) : <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center"><p className="text-base font-bold text-slate-800">Belum ada album</p><p className="mt-2 text-sm text-slate-500">Dokumentasi {type === 'image' ? 'foto' : 'video'} akan ditampilkan di sini setelah dipublikasikan.</p></section>}

    {selectedItem && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#02090e]/90 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={selectedItem.name || (type === 'image' ? 'Pratinjau foto' : 'Pratinjau video')} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelection(null) }}>
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#08151d] shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white sm:px-5"><div className="min-w-0"><p className="truncate text-sm font-bold">{selectedItem.name || (type === 'image' ? 'Dokumentasi foto' : 'Dokumentasi video')}</p><p className="mt-0.5 truncate text-[11px] text-slate-400">{selectedAlbum.title} · {selection.itemIndex + 1} dari {selectedAlbum.items.length}</p></div><button type="button" autoFocus onClick={() => setSelection(null)} aria-label="Tutup pratinjau" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"><X className="h-5 w-5" /></button></div>
        <div className="relative grid min-h-0 flex-1 place-items-center overflow-auto p-2 sm:p-4">
          {type === 'image' ? <img src={selectedItem.path} alt={selectedItem.name || ''} className="max-h-[calc(100dvh-9rem)] max-w-full object-contain sm:max-h-[calc(100dvh-11rem)]" /> : isExternalVideo(selectedItem) ? embedUrl ? <div className="flex w-full max-w-5xl flex-col items-center gap-3"><iframe key={embedUrl} src={embedUrl} title={selectedItem.name || 'Video galeri'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="aspect-video max-h-[calc(100dvh-11rem)] w-full rounded-lg bg-black" /><a href={selectedItem.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900"><ExternalLink className="h-4 w-4" />Buka di platform asal</a></div> : <div className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-xl bg-slate-900 p-6 text-center text-white"><Play className="h-10 w-10 text-teal-300" /><p className="text-sm">Pratinjau tidak tersedia untuk tautan ini.</p><a href={selectedItem.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900"><ExternalLink className="h-4 w-4" />Buka video di situs asal</a></div> : <video key={selectedItem.path} src={selectedItem.path} controls autoPlay playsInline className="max-h-[calc(100dvh-9rem)] w-full max-w-5xl bg-black object-contain sm:max-h-[calc(100dvh-11rem)]" />}
          {selection.itemIndex > 0 && <button type="button" onClick={() => moveItem(-1)} aria-label="Media sebelumnya" className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 sm:left-4"><ChevronLeft className="h-6 w-6" /></button>}
          {selection.itemIndex < selectedAlbum.items.length - 1 && <button type="button" onClick={() => moveItem(1)} aria-label="Media berikutnya" className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 sm:right-4"><ChevronRight className="h-6 w-6" /></button>}
        </div>
        {selectedItem.description && <p className="max-h-24 overflow-y-auto border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-slate-300 sm:px-5">{selectedItem.description}</p>}
      </div>
    </div>}
  </div>
}
