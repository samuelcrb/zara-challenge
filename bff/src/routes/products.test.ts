import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'

vi.mock('../productsCache.js', () => ({
  getCachedProducts: vi.fn(),
  setCachedProducts: vi.fn(),
}))

vi.mock('../imageProcessor.js', () => ({
  preloadImages: vi.fn(),
}))

import productsRouter from './products.js'
import * as cache from '../productsCache.js'

const app = express()
app.use('/', productsRouter)

const mockUpstream = (body: unknown, status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  )
}

beforeEach(() => {
  vi.mocked(cache.getCachedProducts).mockReturnValue(undefined)
  vi.mocked(cache.setCachedProducts).mockReset()
})

describe('GET /', () => {
  it('returns cached data without calling upstream', async () => {
    const cached = [{ id: '1', imageUrl: 'u' }]
    vi.mocked(cache.getCachedProducts).mockReturnValue(cached)
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(cached)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches upstream on cache miss, caches and returns result', async () => {
    const products = [{ id: '1', imageUrl: 'u' }]
    mockUpstream(products)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(products)
    expect(cache.setCachedProducts).toHaveBeenCalledOnce()
  })

  it('deduplicates products with repeated ids', async () => {
    const raw = [
      { id: 'abc', imageUrl: 'u1' },
      { id: 'abc', imageUrl: 'u2' },
    ]
    mockUpstream(raw)

    const res = await supertest(app).get('/')

    expect(res.body[0].id).toBe('abc')
    expect(res.body[1].id).not.toBe('abc')
    expect(res.body[1].id).toMatch(/^abc-/)
  })

  it('forwards search, limit and offset to upstream', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchSpy)

    await supertest(app).get('/').query({ search: 'samsung', limit: '10', offset: '5' })

    const calledUrl: URL = fetchSpy.mock.calls[0][0]
    expect(calledUrl.searchParams.get('search')).toBe('samsung')
    expect(calledUrl.searchParams.get('limit')).toBe('10')
    expect(calledUrl.searchParams.get('offset')).toBe('5')
  })

  it('does not cache when upstream returns a non-ok status', async () => {
    mockUpstream({ error: 'upstream down' }, 502)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(502)
    expect(cache.setCachedProducts).not.toHaveBeenCalled()
  })
})
