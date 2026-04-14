import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartContext } from '@/features/cart/CartContext'
import { getImageUrl } from '@/utils/image.utils'
import { FADE_DURATION } from '@/constants/animation'
import styles from './Cart.module.scss'

const Cart = () => {
  const navigate = useNavigate()
  const { cart, removeFromCart, totalItems, totalPrice } = useCartContext()
  const [fadingItems, setFadingItems] = useState<Set<string>>(new Set())
  const [cartContentFading, setCartContentFading] = useState(false)

  const handleRemove = (cartItemId: string) => {
    const isLast = cart.length === 1
    setFadingItems(prev => new Set(prev).add(cartItemId))
    if (isLast) setCartContentFading(true)
    setTimeout(() => {
      removeFromCart(cartItemId)
      setFadingItems(prev => {
        const next = new Set(prev)
        next.delete(cartItemId)
        return next
      })
      setCartContentFading(false)
    }, FADE_DURATION)
  }

  const showCartContent = cart.length > 0 || cartContentFading

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>CART (<span key={totalItems} className={styles.animatedValue}>{totalItems}</span>)</h1>

      {showCartContent && (
        <ul className={styles.itemList}>
          {cart.map(item => (
            <li
              key={item.cartItemId}
              className={`${styles.item}${fadingItems.has(item.cartItemId) ? ` ${styles.itemFading}` : ''}`}
            >
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
                  onClick={() => handleRemove(item.cartItemId)}
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
          {showCartContent && (
            <div className={`${styles.totalRow}${cartContentFading ? ` ${styles.contentFading}` : ''}`}>
              <span className={styles.totalLabel}>TOTAL</span>
              <span key={totalPrice} className={`${styles.totalAmount} ${styles.animatedValue}`}>{totalPrice} EUR</span>
            </div>
          )}
          <div className={styles.buttons}>
            <button className={styles.continueBtn} onClick={() => navigate('/')}>
              CONTINUE SHOPPING
            </button>
            {showCartContent && (
              <div className={`${styles.payGroup}${cartContentFading ? ` ${styles.contentFading}` : ''}`}>
                <span className={styles.totalDesktop}>
                  TOTAL&nbsp;&nbsp;&nbsp;<span key={totalPrice} className={styles.animatedValue}>{totalPrice} EUR</span>
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
