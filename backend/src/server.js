import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testConnection } from './db.js'
import { initializeDatabase } from './initDb.js'
import profileRoutes from './routes/profileRoutes.js'
import linksRoutes from './routes/linksRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import authRoutes from './routes/authRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import messagesRoutes from './routes/messagesRoutes.js'
import aiRoutes from './routes/aiRoutes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const docsDir = path.resolve(__dirname, '../../docs')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// İstek günlüğü (Request logger)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'linktree-backend'
  })
})

// API Rotaları
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/links', linksRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/ai', aiRoutes)

// API Dokümantasyonu (OpenAPI / Swagger & Postman)
app.get('/api/docs/swagger.json', (req, res) => {
  const swaggerPath = path.join(docsDir, 'swagger.json')
  if (fs.existsSync(swaggerPath)) {
    return res.sendFile(swaggerPath)
  }
  res.status(404).json({ error: 'Swagger dosyası bulunamadı' })
})

app.get('/api/docs/postman.json', (req, res) => {
  const postmanPath = path.join(docsDir, 'postman_collection.json')
  if (fs.existsSync(postmanPath)) {
    return res.sendFile(postmanPath)
  }
  res.status(404).json({ error: 'Postman koleksiyonu bulunamadı' })
})

app.get('/api/docs', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Linkspace API Dokümantasyonu (Swagger & Postman)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background-color: #0c0c0b; color: #fff; font-family: system-ui, sans-serif; }
    .topbar-custom {
      background: #161616;
      border-bottom: 1px solid #282828;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand { font-size: 18px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }
    .brand span { color: #FFFF00; }
    .badge { background: rgba(255, 255, 0, 0.15); color: #FFFF00; border: 1px solid rgba(255, 255, 0, 0.3); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
    .actions { display: flex; gap: 12px; }
    .btn { background: #FFFF00; color: #000; text-decoration: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; transition: transform 0.15s; }
    .btn:hover { transform: scale(1.05); }
    .btn-outline { background: #222; color: #ddd; border: 1px solid #333; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div class="topbar-custom">
    <div class="brand">
      <span>linkspace</span> REST API Dokümantasyonu
      <span class="badge">OpenAPI 3.0</span>
    </div>
    <div class="actions">
      <a href="/api/docs/postman.json" download="linkspace_postman_collection.json" class="btn btn-outline">📥 Postman Koleksiyonunu İndir</a>
      <a href="/api/docs/swagger.json" target="_blank" class="btn">📄 Raw Swagger JSON</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ]
      });
    };
  </script>
</body>
</html>
  `)
})

// Bilinmeyen Rota Yakalayıcı (404)
app.use((req, res) => {
  res.status(404).json({ error: 'İstenen uç nokta bulunamadı' })
})

// Global Hata Yakalama Middleware'i
app.use((err, req, res, next) => {
  console.error('Sunucu Hatası:', err)
  res.status(500).json({ error: 'Sunucu tarafında beklenmeyen bir hata oluştu' })
})

// Sunucu Başlatma
const startServer = async () => {
  console.log('🚀 Linktree Backend başlatılıyor...')
  
  // Veritabanı bağlantı testi ve şema kurulumu
  const isConnected = await testConnection()
  if (isConnected) {
    await initializeDatabase()
  } else {
    console.warn('⚠️ PostgreSQL servisi henüz çalışmıyor olabilir. Sunucu çalışmaya devam ediyor, veritabanı hazır olduğunda bağlantı otomatik sağlanacaktır.')
  }

  app.listen(PORT, () => {
    console.log(`✨ Backend API sunucusu http://localhost:${PORT} üzerinde dinlemede.`)
    console.log(`📡 Sağlık Kontrolü: http://localhost:${PORT}/api/health`)
  })
}

startServer()
