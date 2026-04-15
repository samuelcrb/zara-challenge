import type { Product } from '@/features/products/types/product.types'
import PhoneCard from '@/features/products/components/PhoneCard/PhoneCard'
import styles from './PhoneGrid.module.scss'

interface PhoneGridProps {
  products: Product[]
  animationType?: 'fade' | 'filter' | 'none'
  exiting?: boolean
}

const PhoneGrid = ({
  products,
  animationType = 'none',
  exiting = false,
}: PhoneGridProps) => {
  const classList = [
    styles.grid,
    animationType === 'fade' && styles.fadeEntering,
    animationType === 'filter' && styles.slideEntering,
    exiting && styles.exiting,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ul className={classList} aria-label="Products list">
      {products.map(product => (
        <li key={product.renderKey}>
          <PhoneCard product={product} />
        </li>
      ))}
    </ul>
  )
}

export default PhoneGrid
