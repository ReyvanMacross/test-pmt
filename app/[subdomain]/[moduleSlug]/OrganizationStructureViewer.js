'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Maximize2, UsersRound, X } from 'lucide-react'

function escapeXml(value) {
  return String(value || '').replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character])
}

function OrganizationDiagram({ chart, expanded = false }) {
  const levels = [1, 2, 3, 4].map((level) => ({
    level,
    items: chart.filter((item) => Number(item.level) === level && item.jabatan),
  })).filter((group) => group.items.length)

  if (!levels.length) return <p className="py-8 text-center text-sm text-slate-500">Bagan organisasi belum memiliki jabatan.</p>

  return <div className={`mx-auto w-full max-w-6xl ${expanded ? 'space-y-5' : 'space-y-3 sm:space-y-4'}`}>
    {levels.map(({ level, items }, index) => <div key={level} className="flex flex-col items-center">
      <div className={`grid w-full ${expanded ? 'gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {items.map((item, itemIndex) => <article key={`${item.jabatan}-${itemIndex}`} className={`mx-auto flex min-h-20 w-full max-w-sm flex-col items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-center shadow-sm ${expanded ? 'px-5 py-4' : 'px-3 py-3'}`}>
          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700">Tingkat {level}</span>
          <h4 className={`mt-1 font-bold leading-snug text-slate-800 ${expanded ? 'text-base' : 'text-xs sm:text-sm'}`}>{item.jabatan}</h4>
          {item.nama && <p className="mt-1 text-xs text-slate-600">{item.nama}</p>}
        </article>)}
      </div>
      {index < levels.length - 1 && <span aria-hidden="true" className={`w-0.5 bg-slate-300 ${expanded ? 'my-3 h-8' : 'my-2 h-5'}`}/>}
    </div>)}
  </div>
}

function createDiagramSvg(chart, title) {
  const levels = [1, 2, 3, 4].map((level) => ({ level, items: chart.filter((item) => Number(item.level) === level && item.jabatan) })).filter((group) => group.items.length)
  const width = 1200
  const cardWidth = 260
  const cardHeight = 100
  const gap = 20
  const columns = 4
  let y = 40
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" viewBox="0 0 ${width} ${Math.max(220, 80 + levels.reduce((sum, group) => sum + Math.ceil(group.items.length / columns) * (cardHeight + gap) + 54, 0))}">`, '<rect width="100%" height="100%" fill="#f8fafc"/>', `<text x="600" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="#0f172a">${escapeXml(title || 'Struktur Organisasi')}</text>`]
  for (const group of levels) {
    for (let offset = 0; offset < group.items.length; offset += columns) {
      const row = group.items.slice(offset, offset + columns)
      const rowWidth = row.length * cardWidth + (row.length - 1) * gap
      const startX = (width - rowWidth) / 2
      row.forEach((item, index) => {
        const x = startX + index * (cardWidth + gap)
        parts.push(`<rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="16" fill="#f0fdfa" stroke="#99f6e4" stroke-width="2"/>`)
        parts.push(`<text x="${x + cardWidth / 2}" y="${y + 32}" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#0f766e">TINGKAT ${group.level}</text>`)
        parts.push(`<text x="${x + cardWidth / 2}" y="${y + 58}" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#1e293b">${escapeXml(item.jabatan).slice(0, 70)}</text>`)
        if (item.nama) parts.push(`<text x="${x + cardWidth / 2}" y="${y + 80}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#475569">${escapeXml(item.nama).slice(0, 70)}</text>`)
      })
      y += cardHeight + gap
    }
    y += 14
  }
  parts.push('</svg>')
  return parts.join('')
}

export default function OrganizationStructureViewer({ content = {}, headerTitle = '', subtitle = '' }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const mode = content.metadata?.organization_mode || 'image'
  const chart = Array.isArray(content.metadata?.organization_chart) ? content.metadata.organization_chart : []
  const image = Array.isArray(content.images) ? content.images[0] : null
  const imageUrl = image?.url || image?.path || ''
  const title = content.title || 'Bagan Susunan Organisasi'
  const hasDiagram = mode === 'builder' && chart.length > 0
  const downloadName = useMemo(() => `${(title || 'struktur-organisasi').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`, [title])

  useEffect(() => {
    if (!isExpanded) return undefined
    const handleKeyDown = (event) => { if (event.key === 'Escape') setIsExpanded(false) }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  async function handleDownload() {
    let blob
    let filename
    if (hasDiagram) {
      blob = new Blob([createDiagramSvg(chart, title)], { type: 'image/svg+xml;charset=utf-8' })
      filename = downloadName
    } else if (imageUrl) {
      try {
        const response = await fetch(imageUrl)
        if (!response.ok) throw new Error('Gambar tidak dapat diunduh')
        blob = await response.blob()
        filename = image.name || 'bagan-struktur-organisasi'
      } catch {
        window.open(imageUrl, '_blank', 'noopener,noreferrer')
        return
      }
    } else return

    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }

  function renderDiagram(expanded = false) {
    return hasDiagram
      ? <OrganizationDiagram chart={chart} expanded={expanded}/>
      : imageUrl
        ? <img src={imageUrl} alt={title} className={`mx-auto w-full rounded-xl border border-slate-200 bg-white object-contain ${expanded ? 'max-h-[75vh]' : 'max-h-[min(62vh,620px)] sm:max-h-[min(68vh,700px)]'}`} loading="lazy"/>
        : <p className="py-8 text-center text-sm text-slate-500">Gambar bagan organisasi belum diunggah.</p>
  }

  return <>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex min-w-0 items-center gap-3"><UsersRound className="h-6 w-6 shrink-0 text-teal-700"/><div className="min-w-0"><h3 className="font-extrabold text-slate-900">{headerTitle || title}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle || 'Bagan hierarki pembagian tugas aparatur wilayah.'}</p></div></div>
        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2">
        {(hasDiagram || imageUrl) && <button type="button" onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100"><Download className="h-4 w-4"/>Unduh Gambar</button>}
        <button type="button" onClick={() => setIsExpanded(true)} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-teal-800"><Maximize2 className="h-4 w-4"/>Lihat Penuh</button>
        </div>
      </div>
      {renderDiagram()}
    </div>
    {isExpanded && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`Tampilan penuh ${title}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsExpanded(false) }}>
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
          <h3 className="min-w-0 truncate text-sm font-bold text-slate-900 sm:text-base">{title}</h3>
          <div className="flex shrink-0 items-center gap-2">
            {(hasDiagram || imageUrl) && <button type="button" onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"><Download className="h-4 w-4"/><span className="hidden sm:inline">Unduh Gambar</span></button>}
            <button type="button" onClick={() => setIsExpanded(false)} aria-label="Tutup tampilan penuh" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4"/></button>
          </div>
        </div>
        <div className="overflow-auto p-4 sm:p-8">{renderDiagram(true)}</div>
      </div>
    </div>}
  </>
}
