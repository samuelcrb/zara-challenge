import { Link } from 'react-router-dom'
import { useCartContext } from '@/features/cart/CartContext'
import styles from './Navbar.module.scss'
import useLoadingBar from './hooks/useLoadingBar'

interface NavbarProps {
  isLoading: boolean
}

const Navbar = ({ isLoading }: NavbarProps) => {
  const { totalItems } = useCartContext()
  const { barPhase, barWidth } = useLoadingBar(isLoading)

  return (
    <header className={styles.header} role="banner">
      <nav className={styles.nav} aria-label="Main navigation">
        <Link to="/" className={styles.logo} aria-label="Go to home">
          <img src="/logo-navbar.svg" alt="Zara" />
        </Link>

        <Link to="/cart" className={styles.cart} aria-label={`Cart, ${totalItems} items`}>
          <img
            src={totalItems > 0 ? '/cart-active.svg' : '/cart-inactive.svg'}
            alt=""
            aria-hidden="true"
          />
          <span className={styles.cartCount}>{totalItems}</span>
        </Link>
      </nav>

      {barPhase !== 'idle' && (
        <div
          className={`${styles.loadingBar} ${barPhase === 'completing' ? styles.completing : ''}`}
          style={{ width: `${barWidth}%` }}
        />
      )}
    </header>
  )
}

export default Navbar
