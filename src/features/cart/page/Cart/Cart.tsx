import { useNavigate } from 'react-router-dom'
import { useCartContext } from '@/features/cart/CartContext'
import { getImageUrl } from '@/utils/image.utils'
import styles from './Cart.module.scss'

const Cart = () => {
  const navigate = useNavigate()
  const { cart, removeFromCart, totalItems, totalPrice } = useCartContext()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>CART ({totalItems})</h1>

      {cart.length > 0 && (
        <ul className={styles.itemList}>
          {cart.map(item => (
            <li key={item.cartItemId} className={styles.item}>
              <div className={styles.itemImageWrapper}>
                <img
                  src={getImageUrl(item.imageUrl)}
                  alt={`${item.brand} ${item.name}`}
                  className={styles.itemImage}
                />
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemTop}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemMeta}>
                    {item.storage}&nbsp;&nbsp;|&nbsp;&nbsp;{item.color}
                  </p>
                  <p className={styles.itemPrice}>{item.price} EUR</p>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeFromCart(item.cartItemId)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          {cart.length > 0 && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>TOTAL</span>
              <span className={styles.totalAmount}>{totalPrice} EUR</span>
            </div>
          )}
          <div className={styles.buttons}>
            <button className={styles.continueBtn} onClick={() => navigate('/')}>
              CONTINUE SHOPPING
            </button>
            {cart.length > 0 && (
              <div className={styles.payGroup}>
                <span className={styles.totalDesktop}>
                  TOTAL&nbsp;&nbsp;&nbsp;{totalPrice} EUR
                </span>
                <button className={styles.payBtn}>PAY</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
