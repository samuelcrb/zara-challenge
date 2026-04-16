import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type {
  ProductDetail,
  ColorOption,
  StorageOption,
} from '@/features/products/types/product.types'
import { getProductById } from '../products.api'

interface UseProductDetailReturn {
  product: ProductDetail | null
  isLoading: boolean
  error: string | null
  selectedColor: ColorOption | null
  selectedStorage: StorageOption | null
  currentPrice: number
  currentImageUrl: string
  canAddToCart: boolean
  handleColorSelect: (color: ColorOption) => void
  handleStorageSelect: (storage: StorageOption) => void
}

/**
 * Manages all state and derived values for the product detail page.
 *
 * Reads the product `id` from the URL, fetches the full `ProductDetail`,
 * and exposes selection state for color and storage together with the
 * computed price, image URL, and cart-readiness flag.
 *
 * Both `selectedColor` and `selectedStorage` are reset to `null` whenever
 * the `id` param changes so stale selections never leak across navigations.
 */
const useProductDetail = (): UseProductDetailReturn => {
  const { id } = useParams<{ id: string }>()
  const productId = id ?? ''

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null)
  const [selectedStorage, setSelectedStorage] = useState<StorageOption | null>(null)

  // Reset selections and re-fetch whenever the product id changes
  useEffect(() => {
    if (!productId) return

    let cancelled = false

    setSelectedColor(null)
    setSelectedStorage(null)

    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getProductById(productId)
        if (cancelled) return
        setProduct(data)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchProduct()

    return () => {
      cancelled = true
    }
  }, [productId])

  const currentPrice = selectedStorage?.price ?? product?.basePrice ?? 0
  const currentImageUrl = selectedColor?.imageUrl ?? product?.colorOptions[0].imageUrl ?? ''
  const canAddToCart = selectedColor !== null && selectedStorage !== null

  const handleColorSelect = (color: ColorOption) => setSelectedColor(color)
  const handleStorageSelect = (storage: StorageOption) => setSelectedStorage(storage)

  return {
    product,
    isLoading,
    error,
    selectedColor,
    selectedStorage,
    currentPrice,
    currentImageUrl,
    canAddToCart,
    handleColorSelect,
    handleStorageSelect,
  }
}

export default useProductDetail
