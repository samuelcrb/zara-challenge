import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useProductDetail from '@/features/products/hooks/useProductDetail'
import type { ColorOption } from '@/features/products/types/product.types'
import PhoneCard from '@/features/products/components/PhoneCard/PhoneCard'
import { getImageUrl } from '@/utils/image.utils'
import styles from './PhoneDetail.module.scss'

interface PhoneDetailProps {
  onLoadingChange: (loading: boolean) => void
}

const SPEC_ROWS = [
  { key: 'screen', label: 'Screen' },
  { key: 'resolution', label: 'Resolution' },
  { key: 'processor', label: 'Processor' },
  { key: 'mainCamera', label: 'Main Camera' },
  { key: 'selfieCamera', label: 'Selfie Camera' },
  { key: 'battery', label: 'Battery' },
  { key: 'os', label: 'OS' },
  { key: 'screenRefreshRate', label: 'Screen Refresh Rate' },
] as const

const PhoneDetail = ({ onLoadingChange }: PhoneDetailProps) => {
  const navigate = useNavigate()
  const {
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
  } = useProductDetail()

  const [hoveredColor, setHoveredColor] = useState<ColorOption | null>(null)
  const activeColor = hoveredColor ?? selectedColor

  const scrollRef = useRef<HTMLDivElement>(null)
  const [thumbLeft, setThumbLeft] = useState(0)
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0
    setThumbLeft(ratio * (el.clientWidth - 150))
  }

  const [displayedColorName, setDisplayedColorName] = useState('\u00A0')
  const [colorNameVisible, setColorNameVisible] = useState(true)
  const isFirstColorRender = useRef(true)

  useEffect(() => {
    if (isFirstColorRender.current) {
      isFirstColorRender.current = false
      setDisplayedColorName(activeColor?.name ?? '\u00A0')
      return
    }
    setColorNameVisible(false)
    const timer = setTimeout(() => {
      setDisplayedColorName(activeColor?.name ?? '\u00A0')
      setColorNameVisible(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [activeColor?.name])

  useEffect(() => {
    onLoadingChange(isLoading)
  }, [isLoading, onLoadingChange])

  if (isLoading) return null
  if (error) return <p>{error}</p>
  if (!product) return null

  const priceLabel = selectedStorage
    ? `${currentPrice} EUR`
    : `From ${currentPrice} EUR`

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)}>
        <img src="/arrow.svg" alt="" aria-hidden="true" className={styles.backArrow} />
        BACK
      </button>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.imageCol}>
          <img
            key={currentImageUrl}
            src={getImageUrl(currentImageUrl)}
            alt={`${product.brand} ${product.name}`}
            className={styles.productImage}
          />
        </div>

        <div className={styles.infoCol}>
          <div>
            <h1 className={styles.productName}>
              {product.brand} {product.name}
            </h1>
            <p className={styles.productPrice}>{priceLabel}</p>
          </div>

          {/* Storage */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>STORAGE ¿HOW MUCH SPACE DO YOU NEED?</p>
            <div className={styles.storageOptions}>
              {product.storageOptions.map(storage => (
                <button
                  key={storage.capacity}
                  className={`${styles.storageBtn}${selectedStorage?.capacity === storage.capacity ? ` ${styles.selected}` : ''}`}
                  onClick={() => handleStorageSelect(storage)}
                >
                  {storage.capacity}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>COLOR. PICK YOUR FAVOURITE.</p>
            <div className={styles.colorOptions}>
              {product.colorOptions.map(color => (
                <button
                  key={color.hexCode}
                  className={`${styles.colorSwatch}${selectedColor?.hexCode === color.hexCode ? ` ${styles.selected}` : ''}`}
                  style={{ background: color.hexCode }}
                  onClick={() => handleColorSelect(color)}
                  onMouseEnter={() => setHoveredColor(color)}
                  onMouseLeave={() => setHoveredColor(null)}
                  aria-label={color.name}
                />
              ))}
            </div>
            <p
              className={styles.colorName}
              style={{ opacity: colorNameVisible ? 1 : 0 }}
            >
              {displayedColorName}
            </p>
          </div>

          <button
            className={`${styles.addBtn}${canAddToCart ? ` ${styles.active}` : ''}`}
            disabled={!canAddToCart}
          >
            ADD TO CART
          </button>
        </div>
      </section>

      {/* ── Specifications ────────────────────────────────────── */}
      <section className={styles.specs}>
        <h2 className={styles.sectionTitle}>SPECIFICATIONS</h2>
        <div className={styles.specsTable}>
          <div className={styles.specRow}>
            <span className={styles.specLabel}>Brand</span>
            <span className={styles.specValue}>{product.brand}</span>
          </div>
          <div className={styles.specRow}>
            <span className={styles.specLabel}>Name</span>
            <span className={styles.specValue}>{product.name}</span>
          </div>
          <div className={styles.specRow}>
            <span className={styles.specLabel}>Description</span>
            <span className={styles.specValue}>{product.description}</span>
          </div>
          {SPEC_ROWS.map(({ key, label }) => (
            <div key={key} className={styles.specRow}>
              <span className={styles.specLabel}>{label}</span>
              <span className={styles.specValue}>{product.specs[key]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Similar items ─────────────────────────────────────── */}
      {product.similarProducts.length > 0 && (
        <section className={styles.similar}>
          <h2 className={styles.sectionTitle}>SIMILAR ITEMS</h2>
          <div className={styles.similarScroll} ref={scrollRef} onScroll={handleScroll}>
            {product.similarProducts.map(p => (
              <div key={p.id} className={styles.similarCard}>
                <PhoneCard product={p} />
              </div>
            ))}
          </div>
          <div className={styles.scrollTrack}>
            <div className={styles.scrollThumb} style={{ left: thumbLeft }} />
          </div>
        </section>
      )}
    </div>
  )
}

export default PhoneDetail
