const { loadEnvConfig } = require('@next/env')
const { Pool } = require('pg')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')

loadEnvConfig(process.cwd())

const connectionString = process.env.DATABASE_URL
const production = process.env.NODE_ENV === 'production'
const configuredSsl = process.env.DB_SSL?.toLowerCase()
const useSsl = configuredSsl === 'true' || (configuredSsl !== 'false' && production)
const sslCaFile = process.env.DB_SSL_CA_FILE?.trim()
const ssl = useSsl
  ? {
      rejectUnauthorized: true,
      ...(sslCaFile ? { ca: readFileSync(resolve(process.cwd(), sslCaFile), 'utf8') } : {}),
    }
  : false

if (!connectionString && production) {
  console.error('GAGAL: DATABASE_URL wajib diatur di environment production.')
  process.exit(1)
}

const pool = new Pool({
  ...(connectionString
    ? { connectionString, ssl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'multisite_diskominfo',
        ssl,
      }),
  max: 1,
  connectionTimeoutMillis: 10000,
})

const requiredTables = [
  'users', 'websites', 'menu_items', 'contents', 'news_items', 'announcements',
  'innovations', 'agendas', 'services', 'gallery_albums', 'gallery_items',
  'wilayah_profiles', 'activity_logs',
]

async function main() {
  try {
    const identity = await pool.query('SELECT current_database() AS database, current_user AS username')
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name = ANY($1::text[])`,
      [requiredTables]
    )
    const present = new Set(result.rows.map((row) => row.table_name))
    const missing = requiredTables.filter((table) => !present.has(table))
    const targetHost = connectionString ? new URL(connectionString).hostname : (process.env.DB_HOST || 'localhost')
    console.log(`Database terhubung: ${identity.rows[0].database}`)
    console.log(`User database: ${identity.rows[0].username}`)
    console.log(`Host target: ${targetHost}`)
    console.log(`SSL: ${useSsl ? 'aktif' : 'nonaktif'}`)
    console.log(`Tabel wajib tersedia: ${present.size}/${requiredTables.length}`)
    if (missing.length) {
      console.error(`Tabel belum tersedia: ${missing.join(', ')}`)
      process.exitCode = 1
    } else {
      console.log('Pemeriksaan skema berhasil.')
    }
  } catch (error) {
    console.error(`GAGAL menghubungkan database: ${error.message}`)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
