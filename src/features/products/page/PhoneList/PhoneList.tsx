import { useEffect, useRef, useState } from 'react'
import useProducts from '@/features/products/hooks/useProducts'
import PhoneGrid from '@/features/products/components/PhoneGrid/PhoneGrid'
import SearchBar from '@/components/SearchBar/SearchBar'
import { CONTENT_REVEAL_DELAY, GRID_EXIT_DURATION } from '@/constants/animation'
import type { Product } from '@/features/products/types/product.types'
import styles from './PhoneList.module.scss'

type GridTransition =
  | { status: 'idle' }
  | { status: 'exiting' }
  | { status: 'entering'; variant: 'filter' | 'fade' }

interface PhoneListProps {
  onLoadingChange: (loading: boolean) => void
}

const PhoneList = ({ onLoadingChange }: PhoneListProps) => {
  const { products, isLoading, error, search, setSearch, fetchId } = useProducts()
  const [showContent, setShowContent] = useState(false)
  const [displayedGrid, setDisplayedGrid] = useState<{ products: Product[]; key: number }>({
    products: [],
    key: 0,
  })
  const [transition, setTransition] = useState<GridTransition>({ status: 'idle' })
  const latestProducts = useRef<Product[]>(products)
  latestProducts.current = products
  const latestSearch = useRef(search)
  latestSearch.current = search
  const isFirstFetch = useRef(true)

  // Reset isFirstFetch on unmount so StrictMode's simulated remount starts clean
  useEffect(() => {
    return () => {
      isFirstFetch.current = true
    }
  }, [])

  useEffect(() => {
    onLoadingChange(isLoading)
  }, [isLoading, onLoadingChange])

  useEffect(() => {
    if (isLoading || showContent) return
    const timer = setTimeout(() => setShowContent(true), CONTENT_REVEAL_DELAY)
    return () => clearTimeout(timer)
  }, [isLoading, showContent])

  useEffect(() => {
    if (fetchId === 0) return

    if (isFirstFetch.current) {
      isFirstFetch.current = false
      setDisplayedGrid({ products: latestProducts.current, key: fetchId })
      return
    }

    setTransition({ status: 'exiting' })

    const timer = setTimeout(() => {
      setDisplayedGrid(g => ({ products: latestProducts.current, key: g.key + 1 }))
      setTransition({ status: 'entering' })
    }, GRID_EXIT_DURATION)

    return () => clearTimeout(timer)
  }, [fetchId])

  if (error) {
    return (
      <div className={styles.error} role="alert">
        {error}
      </div>
    )
  }

  const isEntering = transition.status === 'entering'
  const isExiting = transition.status === 'exiting'

  return (
    <div className={styles.container}>
      {showContent && (
        <div className={styles.content}>
          <SearchBar
            value={search}
            onChange={setSearch}
            resultsCount={products.length}
          />
          <PhoneGrid
            key={displayedGrid.key}
            products={displayedGrid.products}
            animate={isEntering}
            exiting={isExiting}
          />
        </div>
      )}
    </div>
  )
}

export default PhoneList
