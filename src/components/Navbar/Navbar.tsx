import { Link } from 'react-router-dom'
import { useCartContext } from '@/features/cart/CartContext'
import styles from './Navbar.module.scss'

const Navbar = () => {
  const { totalItems } = useCartContext()

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
    </header>
  )
}

export default Navbar
