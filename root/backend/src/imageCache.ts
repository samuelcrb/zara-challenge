/**
 * Simple in-memory cache for processed image buffers.
 * Key: original image URL. Value: processed webp Buffer.
 */
const cache = new Map<string, Buffer>()

export const getCached = (url: string): Buffer | undefined => cache.get(url)

export const setCached = (url: string, buffer: Buffer): void => {
  cache.set(url, buffer)
}

export const hasCached = (url: string): boolean => cache.has(url)
