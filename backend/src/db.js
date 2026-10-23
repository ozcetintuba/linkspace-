import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const dbConfig = process.env.DATABASE_URL
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
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 20
    }

export const pool = new Pool(dbConfig)

pool.on('error', (err) => {
  console.error('Beklenmeyen PostgreSQL havuz hatası:', err)
})

export const query = (text, params) => pool.query(text, params)

// Veritabanı bağlantı kontrol fonksiyonu
export const testConnection = async () => {
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
