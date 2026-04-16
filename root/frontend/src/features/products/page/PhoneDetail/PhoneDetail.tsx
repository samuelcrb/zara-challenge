import { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useProductDetail from '@/features/products/hooks/useProductDetail'
import PhoneCard from '@/features/products/components/PhoneCard/PhoneCard'
import ColorSelector from '@/features/products/components/ColorSelector/ColorSelector'
import { useCartContext } from '@/features/cart/CartContext'
import { getImageUrl } from '@/utils/image.utils'
import { formatPrice } from '@/utils/price.utils'
import styles from './PhoneDetail.module.scss'
import { imageReducer } from './PhoneDetail.reducer'

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
  const { addToCart } = useCartContext()
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

  const [image, dispatchImage] = useReducer(imageReducer, {
    front: currentImageUrl,
    back: currentImageUrl,
    fading: false,
  })
  const prevImageUrlRef = useRef(currentImageUrl)

  // Crossfade: preload the incoming image first so the back layer is always
  // fully visible before the front starts fading. Avoids a blank flash on the
  // first few color changes when images aren't yet cached.
  useEffect(() => {
    const prevUrl = prevImageUrlRef.current
    prevImageUrlRef.current = currentImageUrl

    if (!currentImageUrl || currentImageUrl === prevUrl) {
      if (currentImageUrl && !prevUrl) {
        dispatchImage({ type: 'init', url: currentImageUrl })
      }
      return
    }

    if (!prevUrl) {
      dispatchImage({ type: 'init', url: currentImageUrl })
      return
    }

    let cancelled = false
    let fadeTimer: ReturnType<typeof setTimeout> | null = null

    const startFade = () => {
      if (cancelled) return
      dispatchImage({ type: 'fade-start' })
      fadeTimer = setTimeout(() => {
        dispatchImage({ type: 'fade-end', url: currentImageUrl })
      }, 320)
    }

    dispatchImage({ type: 'set-back', url: currentImageUrl })

    const img = new Image()
    img.src = getImageUrl(currentImageUrl)

    if (img.complete) {
      startFade()
    } else {
      img.onload = startFade
      img.onerror = startFade
    }

    return () => {
      cancelled = true
      img.onload = null
      img.onerror = null
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [currentImageUrl])

  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [thumbLeft, setThumbLeft] = useState(0)
  const handleScroll = () => {
    const el = scrollRef.current
    const track = trackRef.current
    if (!el || !track) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0
    setThumbLeft(ratio * (track.clientWidth - 150))
  }

  useEffect(() => {
    onLoadingChange(isLoading)
  }, [isLoading, onLoadingChange])

  if (isLoading) return null
  if (error) return <p>{error}</p>
  if (!product) return null

  const priceLabel = selectedStorage
    ? `${formatPrice(currentPrice)} EUR`
    : `From ${formatPrice(currentPrice)} EUR`

  const handleAddToCart = () => {
    if (!canAddToCart || !product || !selectedColor || !selectedStorage) return
    addToCart({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      imageUrl: currentImageUrl,
      color: selectedColor.name,
      storage: selectedStorage.capacity,
      price: currentPrice,
    })
    navigate('/cart')
  }

  return (
    <>
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <img src="/arrow.svg" alt="" aria-hidden="true" className={styles.backArrow} />
          BACK
        </button>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.imageCol}>
            <img
              src={getImageUrl(image.back)}
              alt=""
              aria-hidden="true"
              className={styles.productImageBack}
            />
            <img
              src={getImageUrl(image.front)}
              alt={`${product.brand} ${product.name}`}
              className={`${styles.productImageFront}${image.fading ? ` ${styles.fading}` : ''}`}
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
              <ColorSelector
                colors={product.colorOptions}
                selectedHexCodes={selectedColor ? [selectedColor.hexCode] : []}
                onChange={hexCode => {
                  const color = product.colorOptions.find(c => c.hexCode === hexCode)
                  if (color) handleColorSelect(color)
                }}
              />
            </div>

            <button
              className={`${styles.addBtn}${canAddToCart ? ` ${styles.active}` : ''}`}
              disabled={!canAddToCart}
              onClick={handleAddToCart}
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
      </div>

      {/* ── Similar items — outside .page, full-width so cards can overflow ── */}
      {product.similarProducts.length > 0 && (
        <section className={styles.similar}>
          <div className={styles.similarAlign}>
            <h2 className={styles.sectionTitle}>SIMILAR ITEMS</h2>
          </div>
          <div className={styles.similarScroll} ref={scrollRef} onScroll={handleScroll}>
            {product.similarProducts.map((p, i) => (
              <div key={p.renderKey ?? `${p.id}-${i}`} className={styles.similarCard}>
                <PhoneCard product={p} />
              </div>
            ))}
          </div>
          <div className={styles.similarAlign}>
            <div className={styles.scrollTrack} ref={trackRef}>
              <div className={styles.scrollThumb} style={{ left: thumbLeft }} />
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default PhoneDetail
