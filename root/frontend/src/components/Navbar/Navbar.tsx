import { Link, useLocation } from 'react-router-dom'
import { useCartContext } from '@/features/cart/CartContext'
import styles from './Navbar.module.scss'
import useLoadingBar from './hooks/useLoadingBar'

interface NavbarProps {
  isLoading: boolean
  showBorder?: boolean
  onCartClick?: () => void
}

const Navbar = ({ isLoading, showBorder = false, onCartClick }: NavbarProps) => {
  const { totalItems } = useCartContext()
  const { barPhase, barWidth } = useLoadingBar(isLoading)
  const { pathname } = useLocation()
  const isCartPage = pathname === '/cart'

  return (
    <header
      className={`${styles.header}${showBorder || isCartPage ? ` ${styles.bordered}` : ''}`}
      role="banner"
    >
      <nav className={styles.nav} aria-label="Navegación principal">
        <Link to="/" className={styles.logo} aria-label="Ir al inicio">
          <img src="/logo-navbar.svg" alt="Zara" />
        </Link>

        {!isCartPage && (
          <Link
            to="/cart"
            className={styles.cart}
            aria-label={`Carrito, ${totalItems} artículos`}
            onClick={e => {
              if (onCartClick) {
                e.preventDefault()
                onCartClick()
              }
            }}
          >
            <img
              src={totalItems > 0 ? '/cart-active.svg' : '/cart-inactive.svg'}
              alt=""
              aria-hidden="true"
            />
            <span className={styles.cartCount}>{totalItems}</span>
          </Link>
        )}
      </nav>

      {!showBorder && barPhase !== 'idle' && (
        <div
          className={`${styles.loadingBar} ${barPhase === 'completing' ? styles.completing : ''}`}
          style={{ width: `${barWidth}%` }}
        />
      )}
    </header>
  )
}

export default Navbar
