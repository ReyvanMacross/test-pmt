'use client'

import { useState } from 'react'
import Link from 'next/link'
import CreateWebsiteModal from './CreateWebsiteModal'

export default function NetworkHeader({ templates }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Website Perangkat Daerah
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola, konfigurasikan template, dan deploy website instan untuk seluruh Dinas, Kecamatan, dan Kelurahan Kota Bandung.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Trash / Archive Button */}
          <Link
            href="/admin/network/trashed"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>Sampah</span>
          </Link>

          {/* Primary Action: Buka Pop-up Tambah Website */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm hover:shadow transition-all group cursor-pointer"
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
            </svg>
            <span>Tambah Website</span>
          </button>
        </div>
      </div>

      {/* Pop-up Modal Deploy Website Baru */}
      <CreateWebsiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templates={templates}
      />
    </>
  )
}
