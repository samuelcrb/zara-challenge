import { useState, useEffect } from 'react'
import type { Product } from '@/features/products/types/product.types'
import useDebounce from '@/hooks/useDebounce'
import preloadImages, { getImageUrl } from '@/utils/image.utils'
import { getProducts } from '../products.api'

interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  search: string
  setSearch: (value: string) => void
  fetchId: number
}

// Module-level cache — persists across PhoneList remounts within the same session
const productCache = new Map<string, Product[]>()

const useProducts = (): UseProductsReturn => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const cached = productCache.get(debouncedSearch)

  const [products, setProducts] = useState<Product[]>(cached ?? [])
  const [isLoading, setIsLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const [fetchId, setFetchId] = useState(cached ? 1 : 0)

  useEffect(() => {
    if (productCache.has(debouncedSearch)) {
      const hit = productCache.get(debouncedSearch)!
      setProducts(hit)
      setIsLoading(false)
      setFetchId(id => (id === 0 ? 1 : id))
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
