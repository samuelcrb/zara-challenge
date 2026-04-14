import { useEffect, useRef, useState } from 'react'
import useProducts from '@/features/products/hooks/useProducts'
import PhoneGrid from '@/features/products/components/PhoneGrid/PhoneGrid'
import SearchBar from '@/components/SearchBar/SearchBar'
import { CONTENT_REVEAL_DELAY, GRID_EXIT_DURATION } from '@/constants/animation'
import type { Product } from '@/features/products/types/product.types'
import styles from './PhoneList.module.scss'

type GridTransition =
  | { status: 'idle' }
  | { status: 'exiting' | 'entering'; variant: 'fade' | 'slide-down' }

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
  const isClearAction = useRef(false)
  const latestProducts = useRef<Product[]>(products)
  latestProducts.current = products
  // Synced from state every render so it resets correctly on remount (survives StrictMode double-invoke)
  const latestDisplayedGridKey = useRef(displayedGrid.key)
  latestDisplayedGridKey.current = displayedGrid.key

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

    if (latestDisplayedGridKey.current === 0) {
      // First render after mount: show products without any transition
      setDisplayedGrid({ products: latestProducts.current, key: fetchId })
      return
    }

    const variant = isClearAction.current ? 'slide-down' : 'fade'
    isClearAction.current = false
    setTransition({ status: 'exiting', variant })

    const timer = setTimeout(() => {
      setDisplayedGrid(g => ({ products: latestProducts.current, key: g.key + 1 }))
      setTransition({ status: 'entering', variant })
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
  const transitionVariant = transition.status !== 'idle' ? transition.variant : undefined

  return (
    <div className={styles.container}>
      {showContent && (
        <div className={styles.content}>
          <SearchBar
            value={search}
            onChange={setSearch}
            onClear={() => {
              isClearAction.current = true
            }}
            resultsCount={products.length}
          />
          <PhoneGrid
            key={displayedGrid.key}
            products={displayedGrid.products}
            animate={isEntering && transitionVariant === 'fade'}
            fadeEnter={isEntering && transitionVariant === 'slide-down'}
            exitVariant={isExiting ? transitionVariant : undefined}
          />
        </div>
      )}
    </div>
  )
}

export default PhoneList
