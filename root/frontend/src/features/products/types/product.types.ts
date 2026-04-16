// Especificaciones detalladas de un producto
export interface ProductSpecs {
  screen: string
  resolution: string
  processor: string
  mainCamera: string
  selfieCamera: string
  battery: string
  os: string
  screenRefreshRate: string
}

// Variante de color disponible para un producto
export interface ColorOption {
  name: string
  hexCode: string
  imageUrl: string
}

// Variante de almacenamiento disponible con su precio
export interface StorageOption {
  capacity: string
  price: number
}

// Producto devuelto por GET /products (listado)
export interface Product {
  id: string
  brand: string
  name: string
  basePrice: number
  imageUrl: string
  renderKey: string
}

// Producto devuelto por GET /products/:id (detalle)
export interface ProductDetail extends Product {
  description: string
  rating: number
  specs: ProductSpecs
  colorOptions: ColorOption[]
  storageOptions: StorageOption[]
  similarProducts: Product[]
}

// Parámetros de query para GET /products
export type GetProductsParams = {
  search?: string
  limit?: number
  offsPet?: number
}

// Estructura de respuesta de error de la API
export interface ApiError {
  error: string
  message: string
}
