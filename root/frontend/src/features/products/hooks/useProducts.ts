import { useState, useEffect, useRef } from 'react'
import type { Product } from '@/features/products/types/product.types'
import useDebounce from '@/hooks/useDebounce'
import { preloadImages, getImageUrl } from '@/utils/image.utils'
import { getProducts } from '../products.api'

interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  search: string
  setSearch: (value: string) => void
  fetchId: number
}

// Caché a nivel de módulo — persiste entre remontajes de PhoneList en la misma sesión
const productCache = new Map<string, Product[]>()

export const clearProductCache = () => productCache.clear()

const useProducts = (): UseProductsReturn => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const cached = productCache.get(debouncedSearch)

  const [products, setProducts] = useState<Product[]>(cached ?? [])
  const [isLoading, setIsLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  // Contador monotónicamente creciente — PhoneList lo observa para disparar transiciones del grid
  const [fetchId, setFetchId] = useState(cached ? 1 : 0)
  // Evita un incremento espurio de fetchId en el primer acierto de caché (p.ej. al volver del carrito)
  const isInitialized = useRef(false)

  // Reinicia isInitialized al desmontar para que el remontaje simulado de StrictMode empiece limpio
  useEffect(() => {
    return () => {
      isInitialized.current = false
    }
  }, [])

  useEffect(() => {
    if (productCache.has(debouncedSearch)) {
      const hit = productCache.get(debouncedSearch)!
      setProducts(hit)
      setIsLoading(false)
      if (isInitialized.current) {
        // Cambio de búsqueda real resuelto desde caché: incrementa para disparar la transición del grid
        setFetchId(id => id + 1)
      } else {
        // Primer render con datos en caché: simplemente asegura que fetchId no sea cero
        setFetchId(id => (id === 0 ? 1 : id))
        isInitialized.current = true
      }
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getProducts({ search: debouncedSearch, limit: 20 }, controller.signal)

        await preloadImages(data.map((p: Product) => getImageUrl(p.imageUrl)))

        if (cancelled) return
        productCache.set(debouncedSearch, data)
        setProducts(data)
        isInitialized.current = true
        setFetchId(id => id + 1)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [debouncedSearch])

  return { products, isLoading, error, search, setSearch, fetchId }
}

export default useProducts
