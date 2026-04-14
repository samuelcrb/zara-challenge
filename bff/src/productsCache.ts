/**
 * In-memory cache for product list responses.
 * Key: stringified query params. Value: cached payload + expiry.
 */

const TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  data: unknown
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

export const getCachedProducts = (key: string): unknown | undefined => {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.data
}

export const setCachedProducts = (key: string, data: unknown): void => {
  cache.set(key, { data, expiresAt: Date.now() + TTL_MS })
}
