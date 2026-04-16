/**
 * LRU in-memory cache for processed image buffers.
 * Key: original image URL. Value: processed webp Buffer.
 *
 * Capped at MAX_ENTRIES to bound memory usage. Map insertion order is used
 * as a cheap LRU proxy: on every hit the entry is re-inserted at the tail,
 * and on overflow the head (oldest) entry is evicted.
 */
const MAX_ENTRIES = 50

const cache = new Map<string, Buffer>()

export const getCached = (url: string): Buffer | undefined => {
  const buf = cache.get(url)
  if (buf === undefined) return undefined
  // Refresh LRU position
  cache.delete(url)
  cache.set(url, buf)
  return buf
}

export const setCached = (url: string, buffer: Buffer): void => {
  if (cache.has(url)) cache.delete(url)
  cache.set(url, buffer)
  if (cache.size > MAX_ENTRIES) {
    cache.delete(cache.keys().next().value!)
  }
}

export const hasCached = (url: string): boolean => cache.has(url)
