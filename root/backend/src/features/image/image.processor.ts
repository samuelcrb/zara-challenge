import sharp from 'sharp'
import { getCached, setCached, hasCached } from './image.cache.js'

const removeWhiteBackground = (
  data: Buffer,
  width: number,
  height: number,
  threshold = 240
): Buffer => {
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength)
  const visited = new Uint8Array(width * height)

  const isBackground = (pos: number): boolean => {
    const i = pos * 4
    return pixels[i] >= threshold && pixels[i + 1] >= threshold && pixels[i + 2] >= threshold
  }

  const queue: number[] = []
  for (let x = 0; x < width; x++) {
    queue.push(x)
    queue.push((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push(y * width)
    queue.push(y * width + (width - 1))
  }

  while (queue.length > 0) {
    const pos = queue.pop()!
    if (visited[pos] || !isBackground(pos)) continue
    visited[pos] = 1
    pixels[pos * 4 + 3] = 0
    const x = pos % width
    const y = Math.floor(pos / width)
    if (x > 0)          queue.push(pos - 1)
    if (x < width - 1)  queue.push(pos + 1)
    if (y > 0)          queue.push(pos - width)
    if (y < height - 1) queue.push(pos + width)
  }

  return Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)
}

/**
 * Descarga, elimina el fondo blanco, recorta y redimensiona una imagen.
 * Devuelve el Buffer webp procesado, usando la caché en memoria si está disponible.
 */
export const processImage = async (url: string): Promise<Buffer> => {
  const cached = getCached(url)
  if (cached) return cached

  const upstream = await fetch(url)
  if (!upstream.ok) throw new Error(`Failed to fetch image: ${upstream.status}`)

  const buffer = Buffer.from(await upstream.arrayBuffer())

  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const cleaned = removeWhiteBackground(data, info.width, info.height)

  const processed = await sharp(cleaned, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .resize({ height: 400, withoutEnlargement: false })
    .webp({ quality: 85 })
    .toBuffer()

  setCached(url, processed)
  return processed
}

/**
 * Procesa una lista de URLs de imágenes en segundo plano (dispara y olvida).
 * Omite URLs ya en caché. Limita la concurrencia para evitar picos de RAM por
 * asignaciones simultáneas de buffers raw de sharp.
 */
const PRELOAD_CONCURRENCY = 3

export const preloadImages = (urls: string[]): void => {
  const pending = urls.filter(url => !hasCached(url))
  if (pending.length === 0) return

  const queue = [...pending]

  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const url = queue.shift()!
      await processImage(url).catch(() => {
        // Ignorar errores de precarga silenciosamente — la ruta de imagen reintentará bajo demanda
      })
    }
  }

  const concurrency = Math.min(PRELOAD_CONCURRENCY, pending.length)
  for (let i = 0; i < concurrency; i++) {
    worker()
  }
}
