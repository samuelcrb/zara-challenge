import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCachedProducts, setCachedProducts, clearProductsCache } from './products.cache.js'

beforeEach(() => clearProductsCache())

describe('getCachedProducts', () => {
  it('returns undefined for unknown key', () => {
    expect(getCachedProducts('missing')).toBeUndefined()
  })

  it('returns stored data while within TTL', () => {
    const data = [{ id: '1', imageUrl: 'http://img.com/1.jpg' }]
    setCachedProducts('key', data)
    expect(getCachedProducts('key')).toEqual(data)
  })

  it('returns undefined and evicts entry after TTL expires', () => {
    vi.useFakeTimers()
    setCachedProducts('key', [{ id: '1' }])

    vi.advanceTimersByTime(5 * 60 * 1000 + 1)

    expect(getCachedProducts('key')).toBeUndefined()
    vi.useRealTimers()
  })
})
