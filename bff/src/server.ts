import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import config from './config.js'
import productsRouter from './routes/products.js'

const app = express()

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())

app.use('/api/products', productsRouter)

/** Global error handler */
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(502).json({ error: 'Upstream error', message: 'Failed to reach the upstream API' })
})

app.listen(config.port, () => {
  console.log(`BFF running at http://localhost:${config.port}`)
})
