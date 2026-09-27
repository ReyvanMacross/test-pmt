import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'diskominfo_secret_key_super_aman_minimal_32_karakter_ya'
)

export async function middleware(request) {
  const sessionCookie = request.cookies.get('session')?.value
  let user = null

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, secretKey, {
        algorithms: ['HS256'],
      })
      user = payload
    } catch {
      user = null
    }
  }

  const { pathname } = request.nextUrl

  // 1. Proteksi route /admin/* -> jika belum login, lempar ke /login
  if (pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Jika sudah login tapi buka /login -> arahkan ke /admin/network (Kelola Website)
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/network'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
