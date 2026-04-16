import { Router, type Request, type Response, type NextFunction } from 'express'
import config from '../config.js'
import { preloadImages } from '../imageProcessor.js'
import { getCachedProducts, setCachedProducts } from '../productsCache.js'

const router = Router()

const upstreamUrl = (path: string) => `${config.upstreamUrl}${path}`

const toHttps = (url: string) => url.replace(/^http:\/\//i, 'https://')

const upstreamHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  'x-api-key': config.apiKey,
}

interface StorageOption {
  capacity: string
  price: number
}

interface RawProduct {
  id: string
  imageUrl: string
  basePrice?: number
  [key: string]: unknown
}

/** Fetch storageOptions for a product and return the minimum price, or undefined on failure */
const fetchMinStoragePrice = async (id: string): Promise<number | undefined> => {
  try {
    const res = await fetch(upstreamUrl(`/products/${id}`), { headers: upstreamHeaders })
    if (!res.ok) return undefined
    const detail = await res.json()
    if (!Array.isArray(detail.storageOptions) || detail.storageOptions.length === 0) return undefined
    return Math.min(...detail.storageOptions.map((s: StorageOption) => s.price))
  } catch {
    return undefined
  }
}

/** GET /api/products */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, limit, offset } = req.query
    const cacheKey = JSON.stringify({ search, limit, offset })

    const cached = getCachedProducts(cacheKey)
    if (cached !== undefined) {
      res.json(cached)
      return
    }

    const url = new URL(upstreamUrl('/products'))
    if (search) url.searchParams.set('search', String(search))
    if (limit) url.searchParams.set('limit', String(limit))
    if (offset) url.searchParams.set('offset', String(offset))

    const upstream = await fetch(url, { headers: upstreamHeaders })
    let raw: Array<{ id: string; imageUrl: string }>
    try {
      raw = await upstream.json()
    } catch {
      res.status(502).json({ error: 'Upstream error', message: 'Failed to reach the upstream API' })
      return
    }

    // Deduplicate ids — when the same id appears more than once, rename subsequent
    // occurrences to `${id}-1`, `${id}-2`, … and assign a stable renderKey per item
    const seenIds = new Set<string>()
    const deduped: RawProduct[] = Array.isArray(raw)
      ? raw.map((p, index) => {
        let uniqueId = p.id
        if (seenIds.has(uniqueId)) {
          let counter = 1
          while (seenIds.has(`${p.id}-${counter}`)) counter++
          uniqueId = `${p.id}-${counter}`
        }
        seenIds.add(uniqueId)
        return { ...p, id: uniqueId, renderKey: `${p.id}-${index}`, imageUrl: toHttps(p.imageUrl) }
      })
      : raw

    // Fetch storageOptions for each product in parallel and correct basePrice to the true minimum
    const data: RawProduct[] = upstream.ok && Array.isArray(deduped)
      ? await Promise.all(
        deduped.map(async p => {
          const minPrice = await fetchMinStoragePrice(p.id)
          if (minPrice !== undefined && minPrice !== p.basePrice) {
            return { ...p, basePrice: minPrice }
          }
          return p
        }),
      )
      : deduped

    if (upstream.ok && Array.isArray(data)) {
      setCachedProducts(cacheKey, data)
    }

    res.status(upstream.status).json(data)

    // Preload images in background so they're ready when the browser requests them
    if (Array.isArray(data)) {
      preloadImages(data.map((p: { imageUrl: string }) => p.imageUrl))
    }
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
    let data: Record<string, unknown>
    try {
      data = await upstream.json()
    } catch {
      res.status(502).json({ error: 'Upstream error', message: 'Failed to reach the upstream API' })
      return
    }

    if (typeof data.imageUrl === 'string') data.imageUrl = toHttps(data.imageUrl)
    if (Array.isArray(data.colorOptions)) {
      data.colorOptions = (data.colorOptions as Array<{ imageUrl?: string }>).map(c =>
        typeof c.imageUrl === 'string' ? { ...c, imageUrl: toHttps(c.imageUrl) } : c
      )
    }

    if (upstream.ok && Array.isArray(data.storageOptions) && data.storageOptions.length > 0) {
      const minPrice = Math.min(...data.storageOptions.map((s: StorageOption) => s.price))
      if (minPrice !== data.basePrice) {
        res.status(upstream.status).json({ ...data, basePrice: minPrice })
        return
      }
    }

    res.status(upstream.status).json(data)
  } catch (err) {
    next(err)
  }
})

export default router
