import { Link } from 'react-router-dom'
import type { Product } from '@/features/products/types/product.types'
import { getImageUrl } from '@/utils/image.utils'
import { formatPrice } from '@/utils/price.utils'
import styles from './PhoneCard.module.scss'

interface PhoneCardProps {
  product: Product
}

const PhoneCard = ({ product }: PhoneCardProps) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className={styles.card}
      aria-label={`${product.brand} ${product.name}, ${formatPrice(product.basePrice)} EUR`}
    >
      <div className={styles.imageWrapper}>
        <img
          src={getImageUrl(product.imageUrl)}
          alt={`${product.brand} ${product.name}`}
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.nameWrapper}>
          <span className={styles.brand}>{product.brand}</span>
          <span className={styles.name}>{product.name}</span>
        </div>
        <span className={styles.price}>{formatPrice(product.basePrice)} EUR</span>
      </div>
    </Link>
  )
}

export default PhoneCard
