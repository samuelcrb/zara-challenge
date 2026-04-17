import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import config from './config.js'

import productsRouter from './features/products/products.router.js'
import imageRouter from './features/image/image.router.js'

const app = express()

// Corrección de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ruta al build del frontend (compatible con Render)
const frontendPath = path.join(process.cwd(), 'frontend/dist')

// -------------------- MIDDLEWARE --------------------

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())

// -------------------- RUTAS API (PRIMERO) --------------------

app.use('/api/products', productsRouter)
app.use('/api/image', imageRouter)

// -------------------- FRONTEND ESTÁTICO --------------------

app.use(express.static(frontendPath))

// -------------------- FALLBACK SPA (SEGURO) --------------------

// IMPORTANTE: no interceptar rutas /api
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Not Found',
      path: req.path,
    })
  }

  res.sendFile(path.join(frontendPath, 'index.html'))
})

// -------------------- MANEJADOR DE ERRORES GLOBAL --------------------

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('🔥 Server error:', err)

    res.status(502).json({
      error: 'Upstream error',
      message: 'Failed to reach the upstream API',
    })
  }
)

// -------------------- ARRANCAR SERVIDOR --------------------

const PORT = config.port || process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en https://localhost:${PORT}`)
})