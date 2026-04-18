import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'

vi.mock('./products.cache.js', () => ({
  getCachedProducts: vi.fn(),
  setCachedProducts: vi.fn(),
}))

vi.mock('../image/image.processor.js', () => ({
  preloadImages: vi.fn(),
}))

import productsRouter from './products.router.js'
import * as cache from './products.cache.js'

const app = express()
app.use('/', productsRouter)
// Manejador de errores para capturar los errores pasados a next(err) en los tests
app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: 'caught' })
})

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
  it('devuelve los datos en caché sin llamar al upstream', async () => {
    const cached = [{ id: '1', imageUrl: 'u' }]
    vi.mocked(cache.getCachedProducts).mockReturnValue(cached)
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(cached)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('consulta el upstream ante un fallo de caché, almacena y devuelve el resultado', async () => {
    const products = [{ id: '1', imageUrl: 'u', basePrice: 100 }]
    const detail = { id: '1', storageOptions: [{ capacity: '128 GB', price: 100 }] }
    mockUpstreamWithDetail(products, detail)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body[0].basePrice).toBe(100)
    expect(cache.setCachedProducts).toHaveBeenCalledOnce()
  })

  it('corrige basePrice al precio mínimo de las opciones de almacenamiento', async () => {
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

  it('mantiene basePrice sin cambios cuando ya es el mínimo', async () => {
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

  it('elimina duplicados de productos con ids repetidos', async () => {
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

  it('reenvía search, limit y offset al upstream', async () => {
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

  it('no almacena en caché cuando el upstream devuelve un estado no válido', async () => {
    mockUpstream({ error: 'upstream down' }, 502)

    const res = await supertest(app).get('/')

    expect(res.status).toBe(502)
    expect(cache.setCachedProducts).not.toHaveBeenCalled()
  })

  it('convierte las imageUrls http a https', async () => {
    const products = [{ id: 'p1', imageUrl: 'http://cdn.example.com/img.jpg', basePrice: 100 }]
    const detail = { id: 'p1', storageOptions: [{ capacity: '128 GB', price: 100 }] }
    mockUpstreamWithDetail(products, detail)

    const res = await supertest(app).get('/')

    expect(res.body[0].imageUrl).toBe('https://cdn.example.com/img.jpg')
  })
})

describe('GET /:id', () => {
  it('corrige basePrice al precio mínimo de las opciones de almacenamiento', async () => {
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

  it('mantiene basePrice cuando ya es el mínimo', async () => {
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

  it('convierte la imageUrl http a https', async () => {
    mockUpstream({
      id: 'p1',
      imageUrl: 'http://cdn.example.com/phone.jpg',
      basePrice: 299,
      storageOptions: [],
    })

    const res = await supertest(app).get('/p1')

    expect(res.body.imageUrl).toBe('https://cdn.example.com/phone.jpg')
  })

  it('convierte las imageUrls http dentro de colorOptions a https', async () => {
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

  it('devuelve 502 cuando upstream.json() lanza un error en GET /:id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('parse error')),
      }),
    )

    const res = await supertest(app).get('/p1')

    expect(res.status).toBe(502)
    expect(res.body.error).toBe('Upstream error')
  })

  it('llama a next(err) cuando fetch lanza un error en GET /:id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    const res = await supertest(app).get('/p1')

    expect(res.status).toBe(500)
  })
})

describe('GET / error paths', () => {
  beforeEach(() => {
    vi.mocked(cache.getCachedProducts).mockReturnValue(undefined)
  })

  it('llama a next(err) cuando fetch lanza un error en GET /', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const res = await supertest(app).get('/')

    expect(res.status).toBe(500)
  })

  it('mantiene el basePrice original cuando fetchMinStoragePrice lanza un error', async () => {
    const products = [{ id: 'p1', imageUrl: 'https://cdn.example.com/img.jpg', basePrice: 500 }]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: URL | string) => {
        const isDetail = /\/products\/[^/]+$/.test(url.toString())
        if (isDetail) return Promise.reject(new Error('network error'))
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(products),
        })
      }),
    )

    const res = await supertest(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body[0].basePrice).toBe(500)
  })

  it('devuelve 502 cuando upstream.json() lanza un error en GET /', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('parse error')),
      }),
    )

    const res = await supertest(app).get('/')

    expect(res.status).toBe(502)
    expect(res.body.error).toBe('Upstream error')
  })
})
