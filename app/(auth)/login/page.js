'use client'

import { useState } from 'react'
import Image from 'next/image'
import { loginAction } from './actions'

export default function LoginPage() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden bg-[#F8FAFC] text-slate-800 antialiased font-sans selection:bg-[#1E88E5] selection:text-white">
      {/* ── Custom CSS Animations & Grid ─────────────────────────────────── */}
      <style jsx>{`
        .bg-grid-pattern {
          background-size: 36px 36px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
      `}</style>

      {/* ── BAGIAN KIRI: HERO BRANDING & ABSTRACT NETWORK ───────────────── */}
      <section
        className="relative w-full lg:w-1/2 text-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 overflow-hidden min-h-[580px] lg:min-h-screen z-10 bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#1E88E5] shadow-2xl"
        data-purpose="brand-hero"
      >
        {/* Background Graphic Layers */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(0,191,165,0.22)_0%,transparent_50%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(212,225,87,0.18)_0%,transparent_50%)] pointer-events-none"></div>

        {/* Abstract Network Vector Graphic (Constellation & Data Nodes) */}
        <svg
          className="absolute bottom-12 sm:bottom-16 left-0 right-0 w-full h-[55%] pointer-events-none opacity-60 mix-blend-screen"
          fill="none"
          preserveAspectRatio="xMidYMax slice"
          viewBox="0 0 800 450"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glow-lime" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="blur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
            <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="blur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
            <linearGradient id="grad-line-lime" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4E157" stopOpacity="0.4"></stop>
              <stop offset="50%" stopColor="#D4E157" stopOpacity="0.9"></stop>
              <stop offset="100%" stopColor="#D4E157" stopOpacity="0.5"></stop>
            </linearGradient>
            <linearGradient id="grad-line-teal" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00BFA5" stopOpacity="0.35"></stop>
              <stop offset="50%" stopColor="#00BFA5" stopOpacity="0.9"></stop>
              <stop offset="100%" stopColor="#00BFA5" stopOpacity="0.6"></stop>
            </linearGradient>
          </defs>
          <path id="network-track-1" d="M40 390 L160 320 L310 350 L460 260 L610 295 L760 190" stroke="url(#grad-line-lime)" strokeDasharray="4 4" strokeWidth="1.8"></path>
          <path id="network-track-2" d="M100 430 L230 380 L410 390 L570 310 L730 330" stroke="url(#grad-line-teal)" strokeOpacity="0.85" strokeWidth="1.8"></path>
          <path d="M160 320 L230 380 M310 350 L410 390 M460 260 L570 310 M610 295 L730 330" stroke="#00BFA5" strokeOpacity="0.45" strokeWidth="1.2"></path>

          <circle cx="160" cy="320" fill="#D4E157" filter="url(#glow-lime)" r="6">
            <animate attributeName="r" values="5;7.5;5" dur="3s" repeatCount="indefinite"></animate>
            <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="310" cy="350" fill="#00BFA5" filter="url(#glow-teal)" r="5.5">
            <animate attributeName="r" values="4.5;6.5;4.5" dur="2.8s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="460" cy="260" fill="#D4E157" filter="url(#glow-lime)" r="7">
            <animate attributeName="r" values="6;9;6" dur="3.2s" repeatCount="indefinite"></animate>
            <animate attributeName="opacity" values="0.7;1;0.7" dur="3.2s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="610" cy="295" fill="#00BFA5" filter="url(#glow-teal)" r="5.5">
            <animate attributeName="r" values="4.5;6.5;4.5" dur="3.5s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="760" cy="190" fill="#D4E157" filter="url(#glow-lime)" r="6.5">
            <animate attributeName="r" values="5.5;8;5.5" dur="2.6s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="230" cy="380" fill="#00BFA5" r="5">
            <animate attributeName="r" values="4;6;4" dur="3.1s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="410" cy="390" fill="#D4E157" r="5">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="570" cy="310" fill="#00BFA5" r="5">
            <animate attributeName="r" values="4;6;4" dur="2.9s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="730" cy="330" fill="#00BFA5" r="5"></circle>

          <circle cx="460" cy="260" stroke="#00BFA5" strokeOpacity="0.6" strokeWidth="1.5" fill="none" r="18">
            <animate attributeName="r" values="14;24;14" dur="3.2s" repeatCount="indefinite"></animate>
            <animate attributeName="stroke-opacity" values="0.7;0.1;0.7" dur="3.2s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx="760" cy="190" stroke="#D4E157" strokeOpacity="0.5" strokeWidth="1.5" fill="none" r="20">
            <animate attributeName="r" values="16;26;16" dur="2.6s" repeatCount="indefinite"></animate>
            <animate attributeName="stroke-opacity" values="0.6;0.1;0.6" dur="2.6s" repeatCount="indefinite"></animate>
          </circle>

          {/* Animated packets moving along network lines */}
          <circle r="4.5" fill="#D4E157" filter="url(#glow-lime)">
            <animateMotion dur="4.8s" repeatCount="indefinite">
              <mpath href="#network-track-1"></mpath>
            </animateMotion>
          </circle>
          <circle r="3.5" fill="#FFFFFF" opacity="0.95">
            <animateMotion dur="4.8s" repeatCount="indefinite">
              <mpath href="#network-track-1"></mpath>
            </animateMotion>
          </circle>
          <circle r="4.5" fill="#00BFA5" filter="url(#glow-teal)">
            <animateMotion dur="5.6s" repeatCount="indefinite">
              <mpath href="#network-track-2"></mpath>
            </animateMotion>
          </circle>
          <circle r="3.5" fill="#FFFFFF" opacity="0.95">
            <animateMotion dur="5.6s" repeatCount="indefinite">
              <mpath href="#network-track-2"></mpath>
            </animateMotion>
          </circle>
        </svg>

        {/* Brand Header */}
        <header className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 p-2 flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300 shrink-0 overflow-hidden backdrop-blur-sm">
            <Image
              src="/images/logo_bdg_putih.png"
              alt="Logo BDG"
              width={56}
              height={56}
              className="w-full h-full object-contain drop-shadow p-0.5"
              priority
            />
          </div>
          <div>
            <div className="text-[12px] font-extrabold tracking-wider uppercase text-white leading-tight">
              PEMERINTAH KOTA BANDUNG
            </div>
            <div className="text-xs font-medium tracking-wide text-blue-100/90 mt-0.5">
              Dinas Komunikasi dan Informatika
            </div>
          </div>
        </header>

        {/* Center Hero Statement */}
        <div className="relative z-10 my-10 lg:my-0 max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-5">
            Portal Multi–Tenant<br />
            <span className="bg-gradient-to-r from-[#D4E157] via-white to-[#00BFA5] bg-clip-text text-transparent">
              Perangkat Daerah
            </span>
          </h1>
          <p className="text-sm sm:text-base text-blue-100/95 leading-relaxed font-normal mb-8 max-w-lg">
            Sistem integrasi akses terpusat pengelolaan aplikasi, tata kelola data, dan pelayanan publik bagi seluruh perangkat daerah Kota Bandung.
          </p>
        </div>

        {/* Left Footer Info */}
        <footer className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-blue-100/80 pt-6 border-t border-white/15 gap-3">
          <p>© 2026 Pemerintah Kota Bandung. Hak Cipta Dilindungi.</p>
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-white/15 backdrop-blur-sm border border-white/20 font-mono text-[11px] text-white">
            v2.0.0
          </span>
        </footer>
      </section>

      {/* ── BAGIAN KANAN: FORM LOGIN ────────────────────────────────────── */}
      <section
        className="w-full lg:w-1/2 bg-[#F8FAFC] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative"
        data-purpose="auth-container"
      >
        {/* Top Status & Utility Bar */}
        <div className="flex items-center justify-between w-full mb-6">
          <div />
          {/* Helpdesk & Language Controls */}
          <div className="flex items-center gap-3.5 text-xs font-medium text-slate-600">
            <a className="hover:text-[#1E88E5] transition-colors flex items-center gap-1.5" href="#">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              {/* <span>Helpdesk TIK</span> */}
              <span>Diskominfo Kota Bandung</span>
            </a>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 font-semibold">
              <button className="text-[#1E88E5]" type="button">ID</button>
              {/* <span className="text-slate-300 font-normal">/</span>
              <button className="text-slate-400 hover:text-slate-700 transition-colors" type="button">EN</button> */}
            </div>
          </div>
        </div>

        {/* Main Login Card Wrapper */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-100">
            {/* Card Header */}
            <div className="mb-6">
              <div className="inline-block px-3 py-1 rounded-md bg-[#1E88E5]/10 text-[#1E88E5] text-[11px] font-bold tracking-wider uppercase mb-3">
                AUTENTIKASI APARATUR &amp; OPERATOR
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Gunakan email resmi (@diskominfo.go.id / terdaftar) untuk mengakses portal layanan kerja.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="identity-input">
                  EMAIL RESMI <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <input
                    className="block w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#1E88E5] focus:ring-4 focus:ring-[#1E88E5]/15 transition-all outline-none"
                    id="identity-input"
                    name="email"
                    placeholder="username@diskominfo.go.id"
                    required
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password-input">
                    KATA SANDI <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <input
                    className="block w-full rounded-xl border border-slate-200 pl-11 pr-11 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#1E88E5] focus:ring-4 focus:ring-[#1E88E5]/15 transition-all outline-none"
                    id="password-input"
                    name="password"
                    placeholder="Masukkan kata sandi portal"
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                  />
                  <button
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    className="w-4 h-4 rounded text-[#1E88E5] border-slate-300 focus:ring-[#1E88E5] focus:ring-offset-0 cursor-pointer"
                    type="checkbox"
                    name="remember"
                  />
                  <span className="text-slate-600 font-medium">Ingat saya di perangkat ini</span>
                </label>
                <a className="font-semibold text-[#1E88E5] hover:text-[#1565C0] transition-colors" href="#">
                  Lupa Kata Sandi?
                </a>
              </div>

              {/* Primary Submit Button */}
              <button
                className="w-full py-3.5 px-6 rounded-xl bg-[#1E88E5] hover:bg-[#1565C0] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#1E88E5]/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    MEMPROSES...
                  </span>
                ) : (
                  <>
                    <span>MASUK KE PORTAL</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Security Note */}
        <footer className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center text-center gap-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
            <svg className="w-4 h-4 text-[#00BFA5] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            {/* <span>Dilindungi oleh Sistem Pengamanan Terenkripsi Diskominfo Kota Bandung &amp; BSSN RI.</span> */}
            <span>Dilindungi oleh Diskominfo Kota Bandung.</span>
          </div>
        </footer>
      </section>
    </div>
  )
}
