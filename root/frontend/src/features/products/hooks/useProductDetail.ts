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
 * Gestiona todo el estado y los valores derivados para la página de detalle de producto.
 *
 * Lee el `id` del producto desde la URL, obtiene el `ProductDetail` completo
 * y expone el estado de selección de color y almacenamiento junto con el
 * precio calculado, la URL de imagen y el indicador de listo para añadir al carrito.
 *
 * Tanto `selectedColor` como `selectedStorage` se reinician a `null` cada vez que
 * cambia el parámetro `id` para evitar que selecciones obsoletas se propaguen entre navegaciones.
 */
const useProductDetail = (): UseProductDetailReturn => {
  const { id } = useParams<{ id: string }>()
  const productId = id ?? ''

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null)
  const [selectedStorage, setSelectedStorage] = useState<StorageOption | null>(null)

  // Reinicia las selecciones y vuelve a obtener datos cada vez que cambia el id del producto
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
