import type { Product } from '@/features/products/types/product.types'
import PhoneCard from '@/features/products/components/PhoneCard/PhoneCard'
import styles from './PhoneGrid.module.scss'

interface PhoneGridProps {
  products: Product[]
  animate?: boolean
  fadeEnter?: boolean
  exitVariant?: 'fade' | 'slide-down'
}

const PhoneGrid = ({
  products,
  animate = false,
  fadeEnter = false,
  exitVariant,
}: PhoneGridProps) => {
  const classList = [
    styles.grid,
    animate && styles.animated,
    fadeEnter && styles.fadeEntering,
    exitVariant === 'fade' && styles.exiting,
    exitVariant === 'slide-down' && styles.slidingOut,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ul className={classList} aria-label="Products list">
      {products.map(product => (
        <li key={product.id}>
          <PhoneCard product={product} />
        </li>
      ))}
    </ul>
  )
}

export default PhoneGrid
