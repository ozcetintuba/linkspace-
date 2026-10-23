import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
const hasDatabaseUrl = !!process.env.DATABASE_URL
const hasExplicitDbHost = !!process.env.DB_HOST && process.env.DB_HOST !== 'localhost'

const dbConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'))
        ? false
        : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'linktree_db',
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      max: 10
    }

export const pool = new Pool(dbConfig)

pool.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') {
    console.warn('⚠️ PostgreSQL havuz bildirimi:', err.message)
  }
})

export const query = (text, params) => {
  if (isProduction && !hasDatabaseUrl && !hasExplicitDbHost) {
    throw new Error('DATABASE_URL_NOT_CONFIGURED')
  }
  return pool.query(text, params)
}

// Veritabanı bağlantı kontrol fonksiyonu
export const testConnection = async () => {
  if (isProduction && !hasDatabaseUrl && !hasExplicitDbHost) {
    console.log('ℹ️ Render üzerinde DATABASE_URL henüz tanımlanmadı. Sistem kesintisiz bellek/çevrimdışı modunda çalışıyor.')
    return false
  }

  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    console.log('✅ PostgreSQL veritabanına başarıyla bağlanıldı. Sunucu saati:', result.rows[0].now)
    return true
  } catch (error) {
    console.warn('⚠️ PostgreSQL bağlantısı kurulamadı:', error.message)
    return false
  }
}
