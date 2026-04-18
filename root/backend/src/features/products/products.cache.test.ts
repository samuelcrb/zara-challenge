import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCachedProducts, setCachedProducts, clearProductsCache } from './products.cache.js'

beforeEach(() => clearProductsCache())

describe('getCachedProducts', () => {
  it('devuelve undefined para una clave desconocida', () => {
    expect(getCachedProducts('missing')).toBeUndefined()
  })

  it('devuelve los datos almacenados mientras no expire el TTL', () => {
    const data = [{ id: '1', imageUrl: 'http://img.com/1.jpg' }]
    setCachedProducts('key', data)
    expect(getCachedProducts('key')).toEqual(data)
  })

  it('devuelve undefined y elimina la entrada tras expirar el TTL', () => {
    vi.useFakeTimers()
    setCachedProducts('key', [{ id: '1' }])

    vi.advanceTimersByTime(5 * 60 * 1000 + 1)

    expect(getCachedProducts('key')).toBeUndefined()
    vi.useRealTimers()
  })
})
