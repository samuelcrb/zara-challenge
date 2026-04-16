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

  it('returns the raw data from http unmodified', async () => {
    const data = [{ id: 'APPLE-1', brand: 'Apple', name: 'iPhone 15', basePrice: 999, imageUrl: 'x', renderKey: 'k' }]
    mockHttp.mockResolvedValue(data)
    const result = await getProducts()
    expect(result).toEqual(data)
  })

  it('removes duplicate products keeping the first occurrence', async () => {
    const product = { id: 'APPLE-1', brand: 'Apple', name: 'iPhone 15', basePrice: 999, imageUrl: 'x', renderKey: 'APPLE-1' }
    mockHttp.mockResolvedValue([product, { ...product, name: 'iPhone 15 duplicate' }])
    const result = await getProducts()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('iPhone 15')
  })

  it('keeps products with different ids', async () => {
    const data = [
      { id: 'APPLE-1', brand: 'Apple', name: 'iPhone 15', basePrice: 999, imageUrl: 'x', renderKey: 'x' },
      { id: 'APPLE-2', brand: 'Apple', name: 'iPhone 14', basePrice: 799, imageUrl: 'y', renderKey: 'y' },
    ]
    mockHttp.mockResolvedValue(data)
    const result = await getProducts()
    expect(result).toHaveLength(2)
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
