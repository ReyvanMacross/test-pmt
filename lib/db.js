import { Pool } from 'pg'

let pool

if (!global._pgPool) {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString && process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL wajib diatur pada environment production. Jangan gunakan fallback localhost di Vercel.'
    )
  }

  const isProduction = process.env.NODE_ENV === 'production'

  global._pgPool = new Pool({
    ...(connectionString
      ? {
          connectionString,
          // SSL hanya untuk production (Supabase/cloud). Lokal tidak perlu SSL.
          ssl: isProduction ? { rejectUnauthorized: true } : false,
        }
      : {
          // Backwards-compatible local/Laragon connection settings.
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'multisite_diskominfo',
          ssl: false,
        }),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
}

pool = global._pgPool

export async function query(text, params) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV === 'development') {
    // Logging singkat untuk monitoring query
    console.log('PostgreSQL Query:', { text: text.substring(0, 100), duration: `${duration}ms`, rows: res.rowCount })
  }
  return res
}

export default pool
