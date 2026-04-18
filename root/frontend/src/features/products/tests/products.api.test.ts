import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProducts, getProductById } from '@/features/products/products.api'
import http from '@/api/http'

vi.mock('@/api/http')

const mockHttp = vi.mocked(http)

describe('API de productos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHttp.mockResolvedValue([])
  })

  // ─── getProducts ────────────────────────────────────────────────────────────

  it('llama a http con el endpoint /products', async () => {
    await getProducts()
    expect(mockHttp).toHaveBeenCalledWith('/products', expect.any(Object))
  })

  it('pasa search y limit como parámetros de consulta', async () => {
    await getProducts({ search: 'iphone', limit: 10 })
    expect(mockHttp).toHaveBeenCalledWith('/products', expect.objectContaining({
      params: { search: 'iphone', limit: 10 },
    }))
  })

  it('pasa el AbortSignal a http', async () => {
    const { signal } = new AbortController()
    await getProducts(undefined, signal)
    expect(mockHttp).toHaveBeenCalledWith('/products', expect.objectContaining({ signal }))
  })

  it('devuelve los datos sin modificar de http', async () => {
    const data = [{ id: 'APPLE-1', brand: 'Apple', name: 'iPhone 15', basePrice: 999, imageUrl: 'x', renderKey: 'k' }]
    mockHttp.mockResolvedValue(data)
    const result = await getProducts()
    expect(result).toEqual(data)
  })

  it('elimina productos duplicados conservando la primera ocurrencia', async () => {
    const product = { id: 'APPLE-1', brand: 'Apple', name: 'iPhone 15', basePrice: 999, imageUrl: 'x', renderKey: 'APPLE-1' }
    mockHttp.mockResolvedValue([product, { ...product, name: 'iPhone 15 duplicate' }])
    const result = await getProducts()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('iPhone 15')
  })

  it('conserva los productos con ids diferentes', async () => {
    const data = [
      { id: 'APPLE-1', brand: 'Apple', name: 'iPhone 15', basePrice: 999, imageUrl: 'x', renderKey: 'x' },
      { id: 'APPLE-2', brand: 'Apple', name: 'iPhone 14', basePrice: 799, imageUrl: 'y', renderKey: 'y' },
    ]
    mockHttp.mockResolvedValue(data)
    const result = await getProducts()
    expect(result).toHaveLength(2)
  })

  // ─── getProductById ─────────────────────────────────────────────────────────

  it('llama a http con /products/:id', async () => {
    await getProductById('APPLE-1')
    expect(mockHttp).toHaveBeenCalledWith('/products/APPLE-1')
  })

  it('devuelve el detalle del producto de http', async () => {
    const detail = { id: 'APPLE-1', name: 'iPhone 15' }
    mockHttp.mockResolvedValue(detail)
    const result = await getProductById('APPLE-1')
    expect(result).toEqual(detail)
  })
})
