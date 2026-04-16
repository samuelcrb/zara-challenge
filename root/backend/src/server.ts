console.log('SERVER VERSION 2 - PING ADDED')
import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import config from './config.js'

import productsRouter from './routes/products.js'
import imageRouter from './routes/image.js'

const app = express()

// ES Modules dirname fix
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Frontend build path (safe for Render)
const frontendPath = path.join(process.cwd(), 'frontend/dist')

// -------------------- MIDDLEWARE --------------------

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())

// -------------------- HEALTH CHECK --------------------

app.get('/ping', (_req, res) => {
  console.log('PING HIT')
  res.json({ ok: true })
})

// -------------------- API ROUTES (FIRST) --------------------

app.use('/api/products', productsRouter)
app.use('/api/image', imageRouter)

// -------------------- STATIC FRONTEND --------------------

app.use(express.static(frontendPath))

// -------------------- SPA FALLBACK (SAFE) --------------------

// IMPORTANT: do NOT intercept /api routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Not Found',
      path: req.path,
    })
  }

  res.sendFile(path.join(frontendPath, 'index.html'))
})

// -------------------- GLOBAL ERROR HANDLER --------------------

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('🔥 Server error:', err)

    res.status(502).json({
      error: 'Upstream error',
      message: 'Failed to reach the upstream API',
    })
  }
)

// -------------------- START SERVER --------------------

const PORT = config.port || process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})