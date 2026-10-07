'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/(auth)/login/actions'

export default function Sidebar({ userRole, permissions = [] }) {
  const pathname = usePathname()
  const isSuperAdmin = userRole === 'super-admin'
  const hasPermission = (permission) => isSuperAdmin || permissions.includes(permission)

  function isKelolaWebsiteActive() {
    return pathname.startsWith('/admin/network')
  }

  function isDashboardActive() {
    return pathname === '/admin/dashboard'
  }

  function isTemplatesActive() {
    return pathname.startsWith('/admin/templates')
  }

  function isUsersActive() {
    return pathname.startsWith('/admin/users')
  }

  function isActivitiesActive() {
    return pathname.startsWith('/admin/activities')
  }

  function isPasswordActive() {
    return pathname.startsWith('/admin/password')
  }

  return (
    <aside
      className="w-64 text-white flex flex-col flex-shrink-0 z-30 shadow-xl border-r border-white/10 h-screen select-none"
      style={{
        width: '260px',
        minWidth: '260px',
        maxWidth: '260px',
        background: 'linear-gradient(180deg, #0D47A1 0%, #1565C0 100%)',
        color: '#FFFFFF',
      }}
    >
      {/* ── Logo & Identitas Aplikasi ────────────────────────────────────── */}
      <div
        className="px-6 py-5 border-b border-white/10 flex items-center gap-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
      >
        <div
          className="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center flex-shrink-0"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Image
            alt="Logo Kota Bandung"
            src="/images/Logo_BDG_WARNA.png"
            width={32}
            height={32}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span
            style={{
              fontWeight: 700,
              fontSize: '15px',
              color: '#FFFFFF',
              letterSpacing: '0.025em',
              lineHeight: 1.2,
            }}
          >
            KOTA BANDUNG
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#DBEAFE',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            MULTI-TENANT PORTAL
          </span>
        </div>
      </div>

      {/* ── Menu Navigasi Sidebar ────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6"
        style={{ padding: '20px 14px' }}
      >
        {/* MENU UTAMA */}
        <div>
          <span
            style={{
              display: 'block',
              padding: '0 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#BFDBFE',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Menu Utama
          </span>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* 1. Kelola Website */}
            {hasPermission('manage-all-websites') || hasPermission('manage-assigned-website') ? <li>
              <Link
                href="/admin/network"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  ...(isKelolaWebsiteActive()
                    ? {
                        backgroundColor: '#1E88E5',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        borderLeft: '4px solid #FFFFFF',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: '#DBEAFE',
                        fontWeight: 500,
                        borderLeft: '4px solid transparent',
                      }),
                }}
                className="hover:bg-white/10 hover:text-white"
              >
                <svg
                  style={{ width: '18px', height: '18px', flexShrink: 0, color: isKelolaWebsiteActive() ? '#FFFFFF' : '#BFDBFE' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>{!isSuperAdmin ? 'Kelola Konten' : 'Kelola Website'}</span>
              </Link>
            </li> : null}

            {/* 2. Dashboard */}
            <li>
              <Link
                href="/admin/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  ...(isDashboardActive()
                    ? {
                        backgroundColor: '#1E88E5',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        borderLeft: '4px solid #FFFFFF',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: '#DBEAFE',
                        fontWeight: 500,
                        borderLeft: '4px solid transparent',
                      }),
                }}
                className="hover:bg-white/10 hover:text-white"
              >
                <svg
                  style={{ width: '18px', height: '18px', flexShrink: 0, color: isDashboardActive() ? '#FFFFFF' : '#BFDBFE' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>Dashboard</span>
              </Link>
            </li>

            {/* Khusus Super Admin: Templates Web, User Management, Activity Logs */}
            {(hasPermission('manage-templates') || hasPermission('manage-users') || hasPermission('view-all-logs') || hasPermission('view-own-logs')) && (
              <>
                {/* 3. Templates Web */}
                {hasPermission('manage-templates') && <>
                <li>
                  <Link
                    href="/admin/templates"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      ...(isTemplatesActive()
                        ? {
                            backgroundColor: '#1E88E5',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            borderLeft: '4px solid #FFFFFF',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }
                        : {
                            backgroundColor: 'transparent',
                            color: '#DBEAFE',
                            fontWeight: 500,
                            borderLeft: '4px solid transparent',
                          }),
                    }}
                    className="hover:bg-white/10 hover:text-white"
                  >
                    <svg
                      style={{ width: '18px', height: '18px', flexShrink: 0, color: isTemplatesActive() ? '#FFFFFF' : '#BFDBFE' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>Templates Web</span>
                  </Link>
                </li>
                </>}

                {/* 4. User Management */}
                {hasPermission('manage-users') && <>
                <li>
                  <Link
                    href="/admin/users"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      ...(isUsersActive()
                        ? {
                            backgroundColor: '#1E88E5',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            borderLeft: '4px solid #FFFFFF',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }
                        : {
                            backgroundColor: 'transparent',
                            color: '#DBEAFE',
                            fontWeight: 500,
                            borderLeft: '4px solid transparent',
                          }),
                    }}
                    className="hover:bg-white/10 hover:text-white"
                  >
                    <svg
                      style={{ width: '18px', height: '18px', flexShrink: 0, color: isUsersActive() ? '#FFFFFF' : '#BFDBFE' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>User Management</span>
                  </Link>
                </li>
                </>}

                {/* 5. Activity Logs */}
                {(hasPermission('view-all-logs') || hasPermission('view-own-logs')) && <>
                <li>
                  <Link
                    href="/admin/activities"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      ...(isActivitiesActive()
                        ? {
                            backgroundColor: '#1E88E5',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            borderLeft: '4px solid #FFFFFF',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }
                        : {
                            backgroundColor: 'transparent',
                            color: '#DBEAFE',
                            fontWeight: 500,
                            borderLeft: '4px solid transparent',
                          }),
                    }}
                    className="hover:bg-white/10 hover:text-white"
                  >
                    <svg
                      style={{ width: '18px', height: '18px', flexShrink: 0, color: isActivitiesActive() ? '#FFFFFF' : '#BFDBFE' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>Activity Logs</span>
                  </Link>
                </li>
                </>}
              </>
            )}
          </ul>
        </div>

        {/* PENGATURAN */}
        <div style={{ marginTop: '24px' }}>
          <span
            style={{
              display: 'block',
              padding: '0 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#BFDBFE',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Pengaturan
          </span>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li>
              <Link
                href="/admin/password"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  ...(isPasswordActive()
                    ? {
                        backgroundColor: '#1E88E5',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        borderLeft: '4px solid #FFFFFF',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: '#DBEAFE',
                        fontWeight: 500,
                        borderLeft: '4px solid transparent',
                      }),
                }}
                className="hover:bg-white/10 hover:text-white"
              >
                <svg
                  style={{ width: '18px', height: '18px', flexShrink: 0, color: isPasswordActive() ? '#FFFFFF' : '#BFDBFE' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>Ganti Password</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── Sidebar Footer / Tombol Keluar ───────────────────────────────── */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
        }}
      >
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#DBEAFE',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="hover:bg-white/10 hover:text-white"
          >
            <svg
              style={{ width: '18px', height: '18px', flexShrink: 0, color: '#BFDBFE' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
