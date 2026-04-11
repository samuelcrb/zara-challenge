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
export const getProducts = (params?: GetProductsParams): Promise<Product[]> => {
  return http<Product[]>('/products', { params })
}

/**
 * Fetches the full detail of a single product by its id
 * @param id - The product id
 * @returns Promise resolving to a full ProductDetail object
 */
export const getProductById = (id: string): Promise<ProductDetail> => {
  return http<ProductDetail>(`/products/${id}`)
}
