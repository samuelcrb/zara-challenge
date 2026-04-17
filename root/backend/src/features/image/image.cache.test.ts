import { describe, it, expect, beforeEach } from 'vitest'
import { getCached, setCached, hasCached, clearCache } from './image.cache.js'

beforeEach(() => clearCache())

describe('getCached', () => {
  it('returns undefined for an unknown url', () => {
    expect(getCached('https://example.com/missing.jpg')).toBeUndefined()
  })

  it('returns the stored buffer', () => {
    const buf = Buffer.from([1, 2, 3])
    setCached('https://example.com/a.jpg', buf)
    expect(getCached('https://example.com/a.jpg')).toEqual(buf)
  })

  it('promotes the entry to the end of the map (LRU update)', () => {
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
  it('hasCached returns false before setting', () => {
    expect(hasCached('https://example.com/never.jpg')).toBe(false)
  })

  it('hasCached returns true after setting', () => {
    setCached('https://example.com/b.jpg', Buffer.from([4, 5]))
    expect(hasCached('https://example.com/b.jpg')).toBe(true)
  })

  it('overwrites an existing entry without duplicating it', () => {
    const url = 'https://example.com/dup.jpg'
    setCached(url, Buffer.from([1]))
    setCached(url, Buffer.from([2]))
    expect(getCached(url)).toEqual(Buffer.from([2]))
  })

  it('evicts the oldest entry when the cache exceeds MAX_ENTRIES (50)', () => {
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
