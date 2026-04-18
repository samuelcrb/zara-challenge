import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// ─── getImageUrl ──────────────────────────────────────────────────────────────

describe('getImageUrl', () => {
  let getImageUrl: (url: string) => string

  beforeAll(async () => {
    vi.stubEnv('VITE_BASE_URL', 'http://localhost:3000')
    vi.resetModules()
    const mod = await import('@/utils/image.utils')
    getImageUrl = mod.getImageUrl
  })

  afterAll(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('construye una URL de proxy que redirige a través del BFF', () => {
    expect(getImageUrl('https://example.com/photo.jpg')).toBe(
      'http://localhost:3000/image?url=https%3A%2F%2Fexample.com%2Fphoto.jpg',
    )
  })

  it('codifica en URL los caracteres especiales de la URL de origen', () => {
    const source = 'https://cdn.example.com/img/phone model.jpg'
    const result = getImageUrl(source)
    expect(result).toContain(encodeURIComponent(source))
  })

  it('convierte las URLs de origen http a https antes de codificar', () => {
    const result = getImageUrl('http://cdn.example.com/photo.jpg')
    expect(result).toBe(
      'http://localhost:3000/image?url=https%3A%2F%2Fcdn.example.com%2Fphoto.jpg',
    )
  })
})

// ─── preloadImages ────────────────────────────────────────────────────────────

describe('preloadImages', () => {
  let preloadImages: (urls: string[]) => Promise<void[]>

  // Mock de Image que dispara onload en la siguiente microtarea tras asignar src
  class LoadingImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_: string) {
      queueMicrotask(() => this.onload?.())
    }
  }

  // Mock de Image que dispara onerror en la siguiente microtarea tras asignar src
  class FailingImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_: string) {
      queueMicrotask(() => this.onerror?.())
    }
  }

  beforeAll(async () => {
    // Importa la implementación real (sin resetear módulos — no usa variables de entorno)
    const mod = await import('@/utils/image.utils')
    preloadImages = mod.preloadImages
  })

  beforeEach(() => {
    vi.stubGlobal('Image', LoadingImage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resuelve de inmediato con un array vacío cuando no se pasan URLs', async () => {
    const result = await preloadImages([])
    expect(result).toEqual([])
  })

  it('resuelve cuando todas las imágenes disparan onload', async () => {
    const result = await preloadImages([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
    ])
    expect(result).toHaveLength(2)
  })

  it('resuelve incluso cuando las imágenes disparan onerror (las imágenes rotas no deben bloquear)', async () => {
    vi.stubGlobal('Image', FailingImage)
    const result = await preloadImages(['https://example.com/broken.jpg'])
    expect(result).toHaveLength(1)
  })

  it('resuelve cuando todas las imágenes se han establecido (mezcla de carga y error)', async () => {
    let callCount = 0
    class MixedImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_: string) {
        callCount++
        if (callCount % 2 === 0) {
          queueMicrotask(() => this.onerror?.())
        } else {
          queueMicrotask(() => this.onload?.())
        }
      }
    }
    vi.stubGlobal('Image', MixedImage)
    const result = await preloadImages(['a.jpg', 'b.jpg', 'c.jpg'])
    expect(result).toHaveLength(3)
  })
})
