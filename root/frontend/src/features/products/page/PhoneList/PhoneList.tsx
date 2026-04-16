import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useProducts from '@/features/products/hooks/useProducts'
import PhoneGrid from '@/features/products/components/PhoneGrid/PhoneGrid'
import ColorSelector from '@/features/products/components/ColorSelector/ColorSelector'
import SearchBar from '@/components/SearchBar/SearchBar'
import PageTransition from '@/components/PageTransition/PageTransition'
import { CONTENT_REVEAL_DELAY, GRID_EXIT_DURATION, HEADER_TRANSITION, PAGE_TRANSITION } from '@/constants/animation'
import { useTransitionDirection } from '@/context/transitionContext'
import type { Product } from '@/features/products/types/product.types'
import styles from './PhoneList.module.scss'

const FILTER_COLORS = [
  { hexCode: '#D9D9D9', name: 'Silver' },
  { hexCode: '#F5F5F5', name: 'White' },
  { hexCode: '#A7C7E7', name: 'Blue' },
  { hexCode: '#5D916B', name: 'Green' },
]

type GridTransition =
  | { status: 'idle' }
  | { status: 'exiting' }
  | { status: 'entering'; variant: 'filter' | 'fade' }

interface PhoneListProps {
  onLoadingChange: (loading: boolean) => void
}

const PhoneList = ({ onLoadingChange }: PhoneListProps) => {
  const direction = useTransitionDirection()
  const { products, isLoading, error, search, setSearch, fetchId } = useProducts()
  const [showContent, setShowContent] = useState(() => direction === 'backward')
  const [displayedGrid, setDisplayedGrid] = useState<{ products: Product[]; key: number }>({
    products: [],
    key: 0,
  })
  const [transition, setTransition] = useState<GridTransition>({ status: 'idle' })
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFilterColor, setSelectedFilterColor] = useState<string | null>(null)
  const latestProducts = useRef<Product[]>(products)
  useLayoutEffect(() => {
    latestProducts.current = products
  })
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
      setTransition({ status: 'entering', variant: 'fade' })
      return
    }

    setTransition({ status: 'exiting' })

    const timer = setTimeout(() => {
      setDisplayedGrid(g => ({ products: latestProducts.current, key: g.key + 1 }))
      setTransition({ status: 'entering', variant: 'filter' })
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

  const isExiting = transition.status === 'exiting'

  const handleFilterClick = () => setFilterOpen(open => !open)

  // When coming back from cart, the SearchBar enters from below (slide up);
  // when leaving to cart, the SearchBar slides down and fades out.
  const searchBarVariants = {
    initial: direction === 'backward'
      ? { y: HEADER_TRANSITION.slideDistance, opacity: 0 }
      : { y: 0, opacity: 1 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: HEADER_TRANSITION.duration,
        ease: HEADER_TRANSITION.ease,
      },
    },
    exit: {
      y: HEADER_TRANSITION.slideDistance,
      opacity: 0,
      transition: {
        duration: HEADER_TRANSITION.duration,
        ease: HEADER_TRANSITION.ease,
      },
    },
  }

  const contentVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: PAGE_TRANSITION.duration,
        ease: PAGE_TRANSITION.ease,
        delay: direction === 'backward' ? 0.08 : 0,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: PAGE_TRANSITION.duration,
        ease: PAGE_TRANSITION.ease,
      },
    },
  }

  return (
    <PageTransition className={styles.container}>
      {showContent && (
        <div className={styles.content}>
          <motion.div
            className={styles.stickyHeader}
            variants={searchBarVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <SearchBar
              value={search}
              onChange={setSearch}
              resultsCount={products.length}
              hideResults={filterOpen}
              rightSlot={
                <div className={styles.filterControls}>
                  <div className={`${styles.filterPanel}${filterOpen ? ` ${styles.filterPanelOpen}` : ''}`}>
                    {/* showColorName=false: en móvil no hay hover, y al seleccionar el nombre aparece tan brevemente que no aporta información útil */}
                    <ColorSelector
                      colors={FILTER_COLORS}
                      selectedHexCode={selectedFilterColor}
                      onChange={setSelectedFilterColor}
                      showColorName={false}
                    />
                  </div>
                  <div className={styles.filterLabelContainer}>
                    <span className={styles.filterLabel} onClick={handleFilterClick}>
                      {filterOpen ? 'CERRAR' : 'FILTRAR'}
                    </span>
                  </div>
                </div>
              }
            />
          </motion.div>
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <PhoneGrid
              key={displayedGrid.key}
              products={displayedGrid.products}
              animationType={
                transition.status === 'entering'
                  ? transition.variant
                  : 'none'
              }
              exiting={isExiting}
            />
          </motion.div>
        </div>
      )}
    </PageTransition>
  )
}

export default PhoneList
