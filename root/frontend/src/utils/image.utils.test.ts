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

  it('builds a proxy URL that routes through the BFF', () => {
    expect(getImageUrl('https://example.com/photo.jpg')).toBe(
      'http://localhost:3000/image?url=https%3A%2F%2Fexample.com%2Fphoto.jpg',
    )
  })

  it('URL-encodes special characters in the source URL', () => {
    const source = 'https://cdn.example.com/img/phone model.jpg'
    const result = getImageUrl(source)
    expect(result).toContain(encodeURIComponent(source))
  })

  it('upgrades http source URLs to https before encoding', () => {
    const result = getImageUrl('http://cdn.example.com/photo.jpg')
    expect(result).toBe(
      'http://localhost:3000/image?url=https%3A%2F%2Fcdn.example.com%2Fphoto.jpg',
    )
  })
})

// ─── preloadImages ────────────────────────────────────────────────────────────

describe('preloadImages', () => {
  let preloadImages: (urls: string[]) => Promise<void[]>

  // A mock Image that fires onload on the next microtask after src is set
  class LoadingImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_: string) {
      queueMicrotask(() => this.onload?.())
    }
  }

  // A mock Image that fires onerror on the next microtask after src is set
  class FailingImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_: string) {
      queueMicrotask(() => this.onerror?.())
    }
  }

  beforeAll(async () => {
    // Import the real implementation (no module reset needed — no env vars used)
    const mod = await import('@/utils/image.utils')
    preloadImages = mod.preloadImages
  })

  beforeEach(() => {
    vi.stubGlobal('Image', LoadingImage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves immediately with an empty array when given no URLs', async () => {
    const result = await preloadImages([])
    expect(result).toEqual([])
  })

  it('resolves when all images fire onload', async () => {
    const result = await preloadImages([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
    ])
    expect(result).toHaveLength(2)
  })

  it('resolves even when images fire onerror (broken images must not block)', async () => {
    vi.stubGlobal('Image', FailingImage)
    const result = await preloadImages(['https://example.com/broken.jpg'])
    expect(result).toHaveLength(1)
  })

  it('resolves after every image has settled (load + error mix)', async () => {
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
