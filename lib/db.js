import { Pool } from 'pg'

let pool

if (!global._pgPool) {
  global._pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'multisite_diskominfo',
    max: 20,
    idleTimeoutMillis: 30000,
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
