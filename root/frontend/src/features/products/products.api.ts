import http from '@/api/http'
import type {
  Product,
  ProductDetail,
  GetProductsParams,
} from '@/features/products/types/product.types'

/**
 * Obtiene una lista paginada y opcionalmente filtrada de productos
 * @param params - Parámetros opcionales de búsqueda, límite y offset
 * @returns Promesa que resuelve a un array de productos
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
 * Obtiene el detalle completo de un producto por su id
 * @param id - El id del producto
 * @returns Promesa que resuelve a un objeto ProductDetail completo
 */
export const getProductById = (id: string): Promise<ProductDetail> => {
  return http<ProductDetail>(`/products/${id}`)
}
