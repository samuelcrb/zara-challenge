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

/** Reemplaza fetch para que la llamada de lista devuelva `listBody` y cualquier llamada de detalle devuelva `detailBody` */
const mockUpstreamWithDetail = (
  listBody: unknown,
  detailBody: unknown,
  listStatus = 200,
) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: URL | string) => {
      const href = url.toString()
      const isDetail = /\/products\/[^/]+$/.test(href) && !/\?/.test(href.split('/products/')[1] ?? '')
      const body = isDetail ? detailBody : listBody
      const status = isDetail ? 200 : listStatus
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
      })
    }),
  )
}

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
    const products = [{ id: '1', imageUrl: 'u', basePrice: 100 }]
    const detail = { id: '1', storageOptions: [{ capacity: '128 GB', price: 100 }] }
    mockUpstreamWithDetail(products, detail)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body[0].basePrice).toBe(100)
    expect(cache.setCachedProducts).toHaveBeenCalledOnce()
  })

  it('corrects basePrice to the minimum storageOptions price', async () => {
    const products = [{ id: 'p1', imageUrl: 'u', basePrice: 500 }]
    const detail = {
      id: 'p1',
      storageOptions: [
        { capacity: '128 GB', price: 399 },
        { capacity: '256 GB', price: 500 },
        { capacity: '512 GB', price: 649 },
      ],
    }
    mockUpstreamWithDetail(products, detail)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body[0].basePrice).toBe(399)
  })

  it('keeps basePrice unchanged when it is already the minimum', async () => {
    const products = [{ id: 'p1', imageUrl: 'u', basePrice: 299 }]
    const detail = {
      id: 'p1',
      storageOptions: [
        { capacity: '64 GB', price: 299 },
        { capacity: '128 GB', price: 399 },
      ],
    }
    mockUpstreamWithDetail(products, detail)

    const res = await supertest(app).get('/')

    expect(res.body[0].basePrice).toBe(299)
  })

  it('deduplicates products with repeated ids', async () => {
    const raw = [
      { id: 'abc', imageUrl: 'u1', basePrice: 100 },
      { id: 'abc', imageUrl: 'u2', basePrice: 100 },
    ]
    const detail = { id: 'abc', storageOptions: [{ capacity: '128 GB', price: 100 }] }
    mockUpstreamWithDetail(raw, detail)

    const res = await supertest(app).get('/')

    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe('abc')
    expect(res.body[0].imageUrl).toContain('u1')
  })

  it('forwards search, limit and offset to upstream', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchSpy)

    await supertest(app).get('/').query({ search: 'samsung', limit: '10', offset: '5' })

    const listCall: URL = fetchSpy.mock.calls[0][0]
    expect(listCall.searchParams.get('search')).toBe('samsung')
    expect(listCall.searchParams.get('limit')).toBe('10')
    expect(listCall.searchParams.get('offset')).toBe('5')
  })

  it('does not cache when upstream returns a non-ok status', async () => {
    mockUpstream({ error: 'upstream down' }, 502)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(502)
    expect(cache.setCachedProducts).not.toHaveBeenCalled()
  })

  it('converts http imageUrls to https', async () => {
    const products = [{ id: 'p1', imageUrl: 'http://cdn.example.com/img.jpg', basePrice: 100 }]
    const detail = { id: 'p1', storageOptions: [{ capacity: '128 GB', price: 100 }] }
    mockUpstreamWithDetail(products, detail)

    const res = await supertest(app).get('/')

    expect(res.body[0].imageUrl).toBe('https://cdn.example.com/img.jpg')
  })
})

describe('GET /:id', () => {
  it('corrects basePrice to the minimum storageOptions price', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: 'p1',
            basePrice: 500,
            storageOptions: [
              { capacity: '128 GB', price: 399 },
              { capacity: '256 GB', price: 500 },
            ],
          }),
      }),
    )

    const res = await supertest(app).get('/p1')

    expect(res.status).toBe(200)
    expect(res.body.basePrice).toBe(399)
  })

  it('keeps basePrice when it is already the minimum', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: 'p1',
            basePrice: 299,
            storageOptions: [
              { capacity: '64 GB', price: 299 },
              { capacity: '128 GB', price: 399 },
            ],
          }),
      }),
    )

    const res = await supertest(app).get('/p1')

    expect(res.body.basePrice).toBe(299)
  })

  it('converts http imageUrl to https', async () => {
    mockUpstream({
      id: 'p1',
      imageUrl: 'http://cdn.example.com/phone.jpg',
      basePrice: 299,
      storageOptions: [],
    })

    const res = await supertest(app).get('/p1')

    expect(res.body.imageUrl).toBe('https://cdn.example.com/phone.jpg')
  })

  it('converts http imageUrls inside colorOptions to https', async () => {
    mockUpstream({
      id: 'p1',
      imageUrl: 'http://cdn.example.com/phone.jpg',
      basePrice: 299,
      storageOptions: [],
      colorOptions: [
        { name: 'Black', hexCode: '#000', imageUrl: 'http://cdn.example.com/black.jpg' },
        { name: 'White', hexCode: '#fff', imageUrl: 'http://cdn.example.com/white.jpg' },
      ],
    })

    const res = await supertest(app).get('/p1')

    expect(res.body.colorOptions[0].imageUrl).toBe('https://cdn.example.com/black.jpg')
    expect(res.body.colorOptions[1].imageUrl).toBe('https://cdn.example.com/white.jpg')
  })
})
