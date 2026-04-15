import { describe, it, expect, vi, afterEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'

// Mock sharp before importing the route so processImage never hits native bindings
vi.mock('sharp', () => {
  const rawResult = {
    data: Buffer.alloc(1 * 1 * 4, 128),
    info: { width: 1, height: 1, channels: 4 },
  }
  const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]) // minimal fake webp

  // processImage calls sharp() twice:
  //   1st: .ensureAlpha().raw().toBuffer({ resolveWithObject: true })  → rawResult
  //   2nd: sharp(raw, opts).trim().resize().webp().toBuffer()          → webpBuffer
  let call = 0
  return {
    default: vi.fn(() => {
      const n = ++call
      const chain: Record<string, unknown> = {}
      for (const m of ['ensureAlpha', 'raw', 'trim', 'resize', 'webp']) {
        chain[m] = () => chain
      }
      chain['toBuffer'] = () =>
        n % 2 === 1 ? Promise.resolve(rawResult) : Promise.resolve(webpBuffer)
      return chain
    }),
  }
})

import imageRouter from './image.js'

const app = express()
app.use('/', imageRouter)

const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
  'base64',
)

afterEach(() => vi.unstubAllGlobals())

describe('GET /', () => {
  it('returns 400 when url param is missing', async () => {
    const res = await supertest(app).get('/')
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 500 when upstream image fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    )
    const res = await supertest(app).get('/').query({ url: 'http://img.com/1.jpg' })
    expect(res.status).toBe(500)
    expect(res.body.error).toBeDefined()
  })

  it('returns webp buffer with correct headers on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(MINIMAL_PNG.buffer),
      }),
    )
    const res = await supertest(app).get('/').query({ url: 'http://img.com/1.jpg' })
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('image/webp')
    expect(res.headers['cache-control']).toContain('max-age=31536000')
  })
})
