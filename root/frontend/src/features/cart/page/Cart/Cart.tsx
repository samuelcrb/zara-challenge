import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCartContext } from '@/features/cart/CartContext'
import { getImageUrl } from '@/utils/image.utils'
import { useTransitionDirection } from '@/context/transitionContext'
import PageTransition from '@/components/PageTransition/PageTransition'
import { FADE_DURATION, HEADER_TRANSITION, PAGE_TRANSITION } from '@/constants/animation'
import styles from './Cart.module.scss'

const Cart = () => {
  const navigate = useNavigate()
  const direction = useTransitionDirection()
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

  // Title: slides down from above on forward entry (from listing),
  // slides up and fades out on backward exit (to listing).
  const titleVariants = {
    initial: direction === 'forward'
      ? { y: -HEADER_TRANSITION.slideDistance, opacity: 0 }
      : { y: 0, opacity: 1 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: HEADER_TRANSITION.duration,
        ease: HEADER_TRANSITION.ease,
      },
    },
    exit: {
      y: -HEADER_TRANSITION.slideDistance,
      opacity: 0,
      transition: {
        duration: HEADER_TRANSITION.duration,
        ease: HEADER_TRANSITION.ease,
      },
    },
  }

  const contentVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: PAGE_TRANSITION.duration,
        ease: PAGE_TRANSITION.ease,
        delay: direction === 'forward' ? 0.08 : 0,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: PAGE_TRANSITION.duration,
        ease: PAGE_TRANSITION.ease,
      },
    },
  }

  return (
    <PageTransition className={styles.page}>
      <motion.h1
        className={styles.title}
        variants={titleVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        CART (<span key={totalItems} className={styles.animatedValue}>{totalItems}</span>)
      </motion.h1>

      <motion.div
        variants={contentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
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
      </motion.div>

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
    </PageTransition>
  )
}

export default Cart
