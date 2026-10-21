'use client'

import { useEffect, useRef } from 'react'
import { Bold, Italic, Link2, List, ListOrdered, Underline } from 'lucide-react'

const tools = [
  { label: 'Tebal', command: 'bold', Icon: Bold },
  { label: 'Miring', command: 'italic', Icon: Italic },
  { label: 'Garis bawah', command: 'underline', Icon: Underline },
  { label: 'Daftar poin', command: 'insertUnorderedList', Icon: List },
  { label: 'Daftar angka', command: 'insertOrderedList', Icon: ListOrdered },
]

export default function InnovationRichEditor({ value, onChange }) {
  const editor = useRef(null)
  useEffect(() => {
    if (!editor.current) return
    const source = String(value || '')
    editor.current.innerHTML = /<\s*[a-z][^>]*>/i.test(source)
      ? source
      : source.split(/\r?\n/).map((line) => line ? `<p>${line.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>` : '<p><br></p>').join('')
  }, [value])

  function apply(command) {
    editor.current?.focus()
    if (command === 'createLink') {
      const url = window.prompt('Masukkan URL tautan (https://…)')
      if (!url) return
      document.execCommand(command, false, url)
    } else document.execCommand(command, false)
    if (editor.current) onChange(editor.current.innerHTML)
  }

  return <div className="overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
    <div role="toolbar" aria-label="Format deskripsi inovasi" className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">{tools.map(({ label, command, Icon }) => <button key={command} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => apply(command)} className="rounded-md p-2 text-slate-700 hover:bg-slate-200"><Icon className="h-4 w-4"/></button>)}<span className="mx-1 h-5 border-l border-slate-300"/><button type="button" title="Tambah tautan" aria-label="Tambah tautan" onMouseDown={(event) => event.preventDefault()} onClick={() => apply('createLink')} className="rounded-md p-2 text-slate-700 hover:bg-slate-200"><Link2 className="h-4 w-4"/></button></div>
    <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Deskripsi lengkap inovasi" aria-multiline="true" onInput={(event) => onChange(event.currentTarget.innerHTML)} className="rich-content min-h-52 px-4 py-3 text-sm leading-7 text-slate-900 outline-none [&_a]:text-blue-700 [&_a]:underline" />
  </div>
}
