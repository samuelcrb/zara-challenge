import http from '@/api/http'
import type {
  Product,
  ProductDetail,
  GetProductsParams,
} from '@/features/products/types/product.types'

/**
 * Fetches a paginated and optionally filtered list of products
 * @param params - Optional search, limit and offset params
 * @returns Promise resolving to an array of products
 */
export const getProducts = async (
  params?: GetProductsParams,
  signal?: AbortSignal
): Promise<Product[]> => {
  const data = await http<Product[]>('/products', { params, signal })
  const seen = new Set<string>()
  return data.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

/**
 * Fetches the full detail of a single product by its id
 * @param id - The product id
 * @returns Promise resolving to a full ProductDetail object
 */
export const getProductById = (id: string): Promise<ProductDetail> => {
  return http<ProductDetail>(`/products/${id}`)
}
