/**
 * Caché LRU en memoria para buffers de imágenes procesadas.
 * Clave: URL original de la imagen. Valor: Buffer webp procesado.
 *
 * Limitado a MAX_ENTRIES para acotar el uso de memoria. El orden de inserción
 * en Map se usa como proxy LRU sencillo: en cada acceso la entrada se reinserta
 * al final, y cuando se supera el límite se expulsa la entrada más antigua.
 */
const MAX_ENTRIES = 50

const cache = new Map<string, Buffer>()

export const getCached = (url: string): Buffer | undefined => {
  const buf = cache.get(url)
  if (buf === undefined) return undefined
  // Actualizar posición LRU
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

export const clearCache = (): void => { cache.clear() }
