import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clearCache } from './image.cache.js'

// sharp se mockea antes de que el módulo del procesador se importe
vi.mock('sharp', () => {
  // processImage llama a sharp() dos veces:
  //   1ª: .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  //   2ª: sharp(raw, opts).trim().resize().webp().toBuffer()
  let call = 0
  return {
    default: vi.fn(() => {
      const n = ++call
      const chain: Record<string, unknown> = {}
      for (const m of ['ensureAlpha', 'raw', 'trim', 'resize', 'webp']) {
        chain[m] = () => chain
      }
      // 1ª llamada devuelve datos raw de 3×3 con píxeles blancos en bordes
      const rawResult = {
        data: Buffer.alloc(3 * 3 * 4, 255), // todos los píxeles completamente blancos (>= 240)
        info: { width: 3, height: 3, channels: 4 },
      }
      const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46])
      chain['toBuffer'] = () =>
        n % 2 === 1 ? Promise.resolve(rawResult) : Promise.resolve(webpBuffer)
      return chain
    }),
  }
})

import { processImage, preloadImages } from './image.processor.js'
import { hasCached } from './image.cache.js'

const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
  'base64',
)

beforeEach(() => {
  clearCache()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(MINIMAL_PNG.buffer),
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('processImage', () => {
  it('descarga, procesa y devuelve un buffer', async () => {
    const result = await processImage('https://example.com/phone.jpg')
    expect(result).toBeInstanceOf(Buffer)
  })

  it('devuelve el buffer en caché en la segunda llamada sin volver a descargar', async () => {
    const url = 'https://example.com/cached.jpg'
    const first = await processImage(url)
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockClear()

    const second = await processImage(url)
    expect(second).toBe(first)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lanza un error cuando la descarga upstream devuelve una respuesta no válida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(processImage('https://example.com/bad.jpg')).rejects.toThrow()
  })
})

describe('preloadImages', () => {
  it('procesa cada URL y la añade a la caché', async () => {
    const url = 'https://example.com/preload.jpg'
    preloadImages([url])
    await vi.waitFor(() => {
      expect(hasCached(url)).toBe(true)
    })
  })

  it('omite las URLs que ya están en caché', async () => {
    const url = 'https://example.com/already.jpg'
    await processImage(url) // put in cache
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockClear()

    preloadImages([url])
    await new Promise(r => setTimeout(r, 50))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('no hace nada cuando la lista está vacía', () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockClear()
    preloadImages([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
