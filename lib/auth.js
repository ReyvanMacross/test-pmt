import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'diskominfo_secret_key_super_aman_minimal_32_karakter_ya'
)

// Buat Sesi JWT dan simpan di HttpOnly Cookie
export async function createSession(user) {
  const sessionToken = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)

  const cookieStore = await cookies()
  cookieStore.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 hari
    path: '/',
  })
}

// Ambil user dari Sesi aktif
export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, secretKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

// Verifikasi token (dapat digunakan di middleware)
export async function verifyToken(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

// Hapus Sesi saat Logout
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
