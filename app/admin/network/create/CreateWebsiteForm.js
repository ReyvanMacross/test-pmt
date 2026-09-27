'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createWebsiteAction } from '../actions'

export default function CreateWebsiteForm({ templates }) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [subdomain, setSubdomain] = useState('')

  // Helper konversi nama ke slug subdomain otomatis
  function handleNameChange(e) {
    const val = e.target.value
    // Hanya auto-fill jika pengguna belum mengedit subdomain secara manual
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setSubdomain(slug)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await createWebsiteAction(formData)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* 1. Nama Website / Perangkat Daerah */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
          Nama Instansi / Website <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Contoh: Kecamatan Sukajadi atau Dinas Kesehatan"
          onChange={handleNameChange}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 2. Subdomain */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="subdomain" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
          Subdomain <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            id="subdomain"
            name="subdomain"
            required
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="sukajadi"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px 0 0 8px',
              border: '1px solid #D1D5DB',
              borderRight: 'none',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <span style={{
            background: '#F3F4F6',
            border: '1px solid #D1D5DB',
            padding: '10px 14px',
            borderRadius: '0 8px 8px 0',
            fontSize: '14px',
            color: '#6B7280'
          }}>
            .bandung.go.id
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', margin: 0 }}>
          Hanya huruf kecil, angka, dan tanda hubung (-). Contoh: <code>sukajadi</code> akan diakses lewat <code>sukajadi.bandung.go.id</code>.
        </p>
      </div>

      {/* 3. Pilihan Template */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
          Pilih Template Desain <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {templates.map((tpl) => (
            <label
              key={tpl.id}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: '#F9FAFB'
              }}
            >
              <input
                type="radio"
                name="template_id"
                value={tpl.id}
                required
                defaultChecked={tpl.slug === 'dinas'}
                style={{ marginTop: '3px' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                  {tpl.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  {tpl.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Deskripsi */}
      <div style={{ marginBottom: '32px' }}>
        <label htmlFor="description" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
          Deskripsi Singkat (Opsional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Tuliskan keterangan singkat mengenai instansi ini..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Tombol Aksi */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Link
          href="/admin/network"
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#4B5563',
            background: '#F3F4F6',
            textDecoration: 'none'
          }}
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 22px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            background: '#2563EB',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Menyimpan...' : 'Simpan Website'}
        </button>
      </div>
    </form>
  )
}
