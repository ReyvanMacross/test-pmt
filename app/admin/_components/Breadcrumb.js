'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

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
      crumbs.push({ label: 'Kelola Konten', href: null, isCurrent: true })
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
