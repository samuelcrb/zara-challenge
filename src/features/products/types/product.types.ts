// Detailed specifications of a product
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

// Available color variant for a product
export interface ColorOption {
  name: string
  hexCode: string
  imageUrl: string
}

// Available storage variant with its price
export interface StorageOption {
  capacity: string
  price: number
}

// Product as returned by GET /products (list)
export interface Product {
  id: string
  brand: string
  name: string
  basePrice: number
  imageUrl: string
}

// Product as returned by GET /products/:id (detail)
export interface ProductDetail extends Product {
  description: string
  rating: number
  specs: ProductSpecs
  colorOptions: ColorOption[]
  storageOptions: StorageOption[]
  similarProducts: Product[]
}

// Query params for GET /products
export type GetProductsParams = {
  search?: string
  limit?: number
  offset?: number
}

// API error response shape
export interface ApiError {
  error: string
  message: string
}
