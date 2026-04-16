import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import config from './config.js'
import productsRouter from './routes/products.js'
import imageRouter from './routes/image.js'

// Initialize Express application
const app = express()

// Get current file path in ES module context
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define absolute path to the Vite production build folder
const frontendPath = path.join(process.cwd(), 'frontend/dist')

// Enable CORS for configured frontend origin
app.use(cors({ origin: config.corsOrigin }))

// Parse incoming JSON payloads
app.use(express.json())

// Register API routes for products
app.use('/api/products', productsRouter)

// Register API routes for images
app.use('/api/image', imageRouter)

// Serve static files from the frontend production build
app.use(express.static(frontendPath))

// SPA fallback: always return index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

// Global error handler for unexpected server or upstream API errors
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)

    res.status(502).json({
      error: 'Upstream error',
      message: 'Failed to reach the upstream API'
    })
  }
)

// Start the HTTP server
app.listen(config.port, () => {
  console.log(`🚀 BFF running at http://localhost:${config.port}`)
})