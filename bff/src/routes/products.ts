import { Router, type Request, type Response, type NextFunction } from 'express'
import config from '../config.js'

const router = Router()

const upstreamUrl = (path: string) => `${config.upstreamUrl}${path}`

const upstreamHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  'x-api-key': config.apiKey,
}

/** GET /api/products */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = new URL(upstreamUrl('/products'))
    const { search, limit, offset } = req.query

    if (search) url.searchParams.set('search', String(search))
    if (limit) url.searchParams.set('limit', String(limit))
    if (offset) url.searchParams.set('offset', String(offset))

    const upstream = await fetch(url, { headers: upstreamHeaders })
    const data = await upstream.json()

    res.status(upstream.status).json(data)
  } catch (err) {
    next(err)
  }
})

/** GET /api/products/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const upstream = await fetch(upstreamUrl(`/products/${req.params.id}`), {
      headers: upstreamHeaders,
    })
    const data = await upstream.json()

    res.status(upstream.status).json(data)
  } catch (err) {
    next(err)
  }
})

export default router
