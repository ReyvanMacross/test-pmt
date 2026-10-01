'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CONTENT_MODULES } from '@/lib/content-modules'

const breadcrumbMap = {
  '/admin/network': 'Manajemen Website',
  '/admin/network/trashed': 'Sampah',
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/activity-logs': 'Activity Logs',
}

function getDynamicLabel(segments) {
  // /admin/network/[id]/edit → "Edit Website"
  if (segments.length === 5 && segments[3] === 'edit') return 'Edit Website'
  // /admin/network/[id]/content → "Kelola Konten"
  if (segments.length === 5 && segments[3] === 'content') return 'Kelola Konten'
  return null
}

export default function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/')

  // Build crumb list
  const crumbs = []

  // Always: Portal Multi-Tenant (root)
  crumbs.push({ label: 'Portal Multi-Tenant', href: '/admin/network', isHome: true })

  // Manajemen Website (always present for /admin/network*)
  if (pathname.startsWith('/admin/network')) {
    crumbs.push({
      label: 'Manajemen Website',
      href: '/admin/network',
      isCurrent: pathname === '/admin/network',
    })

    // /admin/network/trashed
    if (pathname === '/admin/network/trashed') {
      crumbs.push({ label: 'Sampah', href: null, isCurrent: true })
    }

    // /admin/network/[id]/edit
    if (segments.length >= 5 && segments[4] === 'edit') {
      crumbs.push({ label: 'Edit Website', href: null, isCurrent: true })
    }

    // /admin/network/[id]/content
    if (segments.length >= 5 && segments[4] === 'content') {
      const hasSub = segments.length >= 6
      const subSlug = hasSub ? segments[5] : null

      if (hasSub) {
        crumbs.push({
          label: 'Kelola Konten',
          href: `/admin/network/${segments[3]}/content`,
          isCurrent: false,
        })
        if (subSlug === 'berita') {
          crumbs.push({
            label: 'Kelola Berita',
            href: `/admin/network/${segments[3]}/content/berita`,
            isCurrent: segments.length === 6,
          })
          if (segments.length >= 8 && segments[7] === 'edit') {
            crumbs.push({ label: 'Edit Link Berita', href: null, isCurrent: true })
          }
        } else if (subSlug === 'galeri-gambar') {
          crumbs.push({
            label: 'Kelola Galeri Gambar',
            href: `/admin/network/${segments[3]}/content/galeri-gambar`,
            isCurrent: segments.length === 6,
          })
          if (segments.length >= 7) {
            crumbs.push({ label: 'Kelola Isi Album', href: null, isCurrent: true })
          }
        } else if (subSlug === 'galeri-video') {
          crumbs.push({
            label: 'Kelola Galeri Video',
            href: `/admin/network/${segments[3]}/content/galeri-video`,
            isCurrent: segments.length === 6,
          })
          if (segments.length >= 7) {
            crumbs.push({ label: 'Kelola Isi Album Video', href: null, isCurrent: true })
          }
        } else if (subSlug === 'pengumuman') {
          crumbs.push({
            label: 'Kelola Pengumuman',
            href: `/admin/network/${segments[3]}/content/pengumuman`,
            isCurrent: segments.length === 6,
          })
          if (segments.length >= 8 && segments[7] === 'edit') {
            crumbs.push({ label: 'Edit Pengumuman', href: null, isCurrent: true })
          }
        } else if (subSlug === 'inovasi') {
          crumbs.push({
            label: 'Kelola Inovasi',
            href: `/admin/network/${segments[3]}/content/inovasi`,
            isCurrent: segments.length === 6,
          })
          if (segments.length >= 8 && segments[7] === 'edit') {
            crumbs.push({ label: 'Edit Inovasi', href: null, isCurrent: true })
          }
        } else if (subSlug === 'agenda-kegiatan') {
          crumbs.push({
            label: 'Kelola Agenda Kegiatan',
            href: `/admin/network/${segments[3]}/content/agenda-kegiatan`,
            isCurrent: segments.length === 6,
          })
          if (segments.length >= 8 && segments[7] === 'edit') {
            crumbs.push({ label: 'Edit Agenda Kegiatan', href: null, isCurrent: true })
          }
        } else if (subSlug === 'layanan') {
          crumbs.push({
            label: 'Kelola Layanan Publik',
            href: `/admin/network/${segments[3]}/content/layanan`,
            isCurrent: segments.length === 6,
          })
          if (segments.length >= 8 && segments[7] === 'edit') {
            crumbs.push({ label: 'Edit Layanan Publik', href: null, isCurrent: true })
          }
        } else if (subSlug === 'kontak') {
          crumbs.push({
            label: 'Kelola Informasi Kontak',
            href: `/admin/network/${segments[3]}/content/kontak`,
            isCurrent: true,
          })
        } else if (subSlug === 'profil' || subSlug === 'profile') {
          crumbs.push({ label: 'Edit Profil', href: null, isCurrent: true })
        } else {
          const modMeta = CONTENT_MODULES.find((m) => m.slug === subSlug)
          const modTitle = modMeta
            ? modMeta.title
            : subSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          crumbs.push({ label: `Edit ${modTitle}`, href: null, isCurrent: true })
        }
      } else {
        crumbs.push({ label: 'Kelola Konten', href: null, isCurrent: true })
      }
    }

    // /admin/network/create
    if (pathname === '/admin/network/create') {
      crumbs.push({ label: 'Tambah Website', href: null, isCurrent: true })
    }
  } else if (pathname.startsWith('/admin/dashboard')) {
    crumbs.push({ label: 'Dashboard', href: null, isCurrent: true })
  } else if (pathname.startsWith('/admin/templates')) {
    crumbs.push({
      label: 'Templates Web',
      href: '/admin/templates',
      isCurrent: pathname === '/admin/templates',
    })
    if (pathname === '/admin/templates/create') {
      crumbs.push({ label: 'Tambah Template', href: null, isCurrent: true })
    }
    if (segments.length >= 5 && segments[4] === 'edit') {
      crumbs.push({ label: 'Edit Template', href: null, isCurrent: true })
    }
  } else if (pathname.startsWith('/admin/users')) {
    crumbs.push({
      label: 'User Management',
      href: '/admin/users',
      isCurrent: pathname === '/admin/users',
    })
    if (pathname === '/admin/users/trashed') {
      crumbs.push({ label: 'User Terhapus', href: null, isCurrent: true })
    }
    if (segments.length >= 5 && segments[4] === 'edit') {
      crumbs.push({ label: 'Edit User', href: null, isCurrent: true })
    }
  } else if (pathname.startsWith('/admin/activities')) {
    crumbs.push({ label: 'Activity Logs', href: null, isCurrent: true })
  } else if (pathname.startsWith('/admin/password')) {
    crumbs.push({ label: 'Ganti Password', href: null, isCurrent: true })
  }

  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      {crumbs.map((crumb, idx) => (
        <span key={idx} className="flex items-center gap-2">
          {idx === 0 ? (
            <span className="flex items-center text-slate-400">
              <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-slate-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ) : (
            <>
              <span className="text-slate-300">/</span>
              {crumb.isCurrent ? (
                <span className="font-semibold text-slate-800">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-slate-500 hover:text-slate-700 transition-colors font-medium"
                >
                  {crumb.label}
                </Link>
              )}
            </>
          )}
        </span>
      ))}
    </div>
  )
}
