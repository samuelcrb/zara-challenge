import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProducts, getProductById } from '@/features/products/products.api'
import http from '@/api/http'

vi.mock('@/api/http')

const mockHttp = vi.mocked(http)

describe('products API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttp.mockResolvedValue([])
  })

  // ─── getProducts ────────────────────────────────────────────────────────────

  it('calls http with the /products endpoint', async () => {
    await getProducts()
    expect(mockHttp).toHaveBeenCalledWith('/products', expect.any(Object))
  })

  it('passes search and limit as query params', async () => {
    await getProducts({ search: 'iphone', limit: 10 })
    expect(mockHttp).toHaveBeenCalledWith('/products', expect.objectContaining({
      params: { search: 'iphone', limit: 10 },
    }))
  })

  it('passes the AbortSignal to http', async () => {
    const { signal } = new AbortController()
    await getProducts(undefined, signal)
    expect(mockHttp).toHaveBeenCalledWith('/products', expect.objectContaining({ signal }))
  })

  it('returns the data from http', async () => {
    const data = [{ id: 'APPLE-1', brand: 'Apple', name: 'iPhone 15', basePrice: 999, imageUrl: 'x', renderKey: 'k' }]
    mockHttp.mockResolvedValue(data)
    const result = await getProducts()
    expect(result).toEqual(data)
  })

  // ─── getProductById ─────────────────────────────────────────────────────────

  it('calls http with /products/:id', async () => {
    await getProductById('APPLE-1')
    expect(mockHttp).toHaveBeenCalledWith('/products/APPLE-1')
  })

  it('returns the product detail from http', async () => {
    const detail = { id: 'APPLE-1', name: 'iPhone 15' }
    mockHttp.mockResolvedValue(detail)
    const result = await getProductById('APPLE-1')
    expect(result).toEqual(detail)
  })
})
