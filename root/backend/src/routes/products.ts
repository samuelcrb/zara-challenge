import { Router, type Request, type Response, type NextFunction } from 'express'
import config from '../config.js'
import { preloadImages } from '../imageProcessor.js'
import { getCachedProducts, setCachedProducts } from '../productsCache.js'

const router = Router()

const upstreamUrl = (path: string) => `${config.upstreamUrl}${path}`

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
    const raw: Array<{ id: string; imageUrl: string }> = await upstream.json()

    const deduped: RawProduct[] = Array.isArray(raw)
      ? (() => {
          const seen = new Set<string>()
          return raw.map(p => {
            if (!seen.has(p.id)) {
              seen.add(p.id)
              return p
            }
            return { ...p, id: `${p.id}-${crypto.randomUUID().slice(0, 8)}` }
          })
        })()
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
    const data = await upstream.json()

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
