import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useProducts from '@/features/products/hooks/useProducts'
import PhoneGrid from '@/features/products/components/PhoneGrid/PhoneGrid'
import ColorSelector from '@/features/products/components/ColorSelector/ColorSelector'
import SearchBar from '@/components/SearchBar/SearchBar'
import PageTransition from '@/components/PageTransition/PageTransition'
import { CONTENT_REVEAL_DELAY, GRID_EXIT_DURATION, HEADER_TRANSITION, PAGE_TRANSITION } from '@/constants/animation'
import { useTransitionDirection } from '@/context/transitionContext'
import type { Product } from '@/features/products/types/product.types'
import { PRODUCT_COLORS } from '@/features/products/constants/productColors'
import styles from './PhoneList.module.scss'

const FILTER_COLORS = [
  { hexCode: '#2f2c2cff', name: 'Negro' },
  { hexCode: '#e6e0e0ff', name: 'Blanco' },
  { hexCode: '#A7C7E7', name: 'Azul' },
  { hexCode: '#74b585ff', name: 'Verde' },
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
  const [selectedFilterColors, setSelectedFilterColors] = useState<string[]>([])
  const latestProducts = useRef<Product[]>(products)
  useLayoutEffect(() => {
    latestProducts.current = products
  })
  const isFirstFetch = useRef(true)
  const isFirstColorFilter = useRef(true)

  // Reinicia los refs al desmontar para que el remontaje simulado de StrictMode empiece limpio
  useEffect(() => {
    return () => {
      isFirstFetch.current = true
      isFirstColorFilter.current = true
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
    if (isFirstColorFilter.current) {
      isFirstColorFilter.current = false
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransition({ status: 'exiting' })

    const timer = setTimeout(() => {
      setDisplayedGrid(g => ({ ...g, key: g.key + 1 }))
      setTransition({ status: 'entering', variant: 'filter' })
    }, GRID_EXIT_DURATION)

    return () => clearTimeout(timer)
  }, [selectedFilterColors])

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

  const selectedColorKeys = selectedFilterColors
    .map(hex => FILTER_COLORS.find(c => c.hexCode === hex)?.name.toLowerCase())
    .filter((k): k is string => k !== undefined)

  const applyColorFilter = (list: Product[]) =>
    selectedColorKeys.length === 0
      ? list
      : list.filter(p => selectedColorKeys.some(key => PRODUCT_COLORS[p.id]?.includes(key)))

  const handleFilterClick = () => setFilterOpen(open => !open)

  const handleColorSelect = (hexCode: string) => {
    setSelectedFilterColors(prev =>
      prev.includes(hexCode) ? prev.filter(h => h !== hexCode) : [...prev, hexCode]
    )
    setFilterOpen(false)
  }

  const handleClearColors = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFilterColors([])
  }

  // Al volver del carrito, la SearchBar entra desde abajo (deslizamiento hacia arriba);
  // al ir al carrito, se desliza hacia abajo y desaparece con fade.
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
              resultsCount={applyColorFilter(products).length}
              hideResults={filterOpen}
              rightSlot={
                <div className={styles.filterControls}>
                  <div className={`${styles.filterPanel}${filterOpen ? ` ${styles.filterPanelOpen}` : ''}`}>
                    {/* showColorName=false: en móvil no hay hover, y al seleccionar el nombre aparece tan brevemente que no aporta información útil */}
                    <ColorSelector
                      colors={FILTER_COLORS}
                      selectedHexCodes={selectedFilterColors}
                      onChange={handleColorSelect}
                      showColorName={false}
                    />
                  </div>
                  <div className={styles.filterLabelContainer}>
                    <button type="button" className={styles.filterLabel} onClick={handleFilterClick}>
                      {filterOpen
                        ? 'CERRAR'
                        : selectedFilterColors.length > 0
                          ? `FILTRAR (${selectedFilterColors.length})`
                          : 'FILTRAR'}
                    </button>
                    {selectedFilterColors.length > 0 && !filterOpen && (
                      <button type="button" className={styles.filterClear} onClick={handleClearColors}>✕</button>
                    )}
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
              products={applyColorFilter(displayedGrid.products)}
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
