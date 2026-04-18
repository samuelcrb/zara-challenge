import { describe, it, expect, beforeEach } from 'vitest'
import { getCached, setCached, hasCached, clearCache } from './image.cache.js'

beforeEach(() => clearCache())

describe('getCached', () => {
  it('devuelve undefined para una URL desconocida', () => {
    expect(getCached('https://example.com/missing.jpg')).toBeUndefined()
  })

  it('devuelve el buffer almacenado', () => {
    const buf = Buffer.from([1, 2, 3])
    setCached('https://example.com/a.jpg', buf)
    expect(getCached('https://example.com/a.jpg')).toEqual(buf)
  })

  it('promueve la entrada al final del mapa (actualización LRU)', () => {
    const urlA = 'https://example.com/a.jpg'
    const urlB = 'https://example.com/b.jpg'
    setCached(urlA, Buffer.from([1]))
    setCached(urlB, Buffer.from([2]))
    // Access A to promote it
    getCached(urlA)
    // Both still present
    expect(hasCached(urlA)).toBe(true)
    expect(hasCached(urlB)).toBe(true)
  })
})

describe('setCached', () => {
  it('hasCached devuelve false antes de guardar', () => {
    expect(hasCached('https://example.com/never.jpg')).toBe(false)
  })

  it('hasCached devuelve true después de guardar', () => {
    setCached('https://example.com/b.jpg', Buffer.from([4, 5]))
    expect(hasCached('https://example.com/b.jpg')).toBe(true)
  })

  it('sobreescribe una entrada existente sin duplicarla', () => {
    const url = 'https://example.com/dup.jpg'
    setCached(url, Buffer.from([1]))
    setCached(url, Buffer.from([2]))
    expect(getCached(url)).toEqual(Buffer.from([2]))
  })

  it('expulsa la entrada más antigua cuando la caché supera MAX_ENTRIES (50)', () => {
    const urls: string[] = []
    for (let i = 0; i < 50; i++) {
      const url = `https://example.com/img-${i}.jpg`
      urls.push(url)
      setCached(url, Buffer.from([i]))
    }
    expect(hasCached(urls[0])).toBe(true)

    // One more entry triggers eviction of the oldest
    setCached('https://example.com/overflow.jpg', Buffer.from([99]))

    expect(hasCached(urls[0])).toBe(false)
    expect(hasCached('https://example.com/overflow.jpg')).toBe(true)
  })
})
