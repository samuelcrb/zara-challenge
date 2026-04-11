import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { CartItem, CartContextType } from '@/features/cart/types/cart.types'

/** localStorage key used to persist the cart between sessions */
const CART_STORAGE_KEY = 'zara_cart'

/** React context that holds cart state and actions */
const CartContext = createContext<CartContextType | null>(null)

/**
 * Loads the persisted cart from localStorage.
 * Returns an empty array if no data is found or if parsing fails.
 */
const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as CartItem[]) : []
  } catch {
    return []
  }
}

/**
 * Persists the current cart array to localStorage.
 * @param cart - The cart items to save
 */
const saveCartToStorage = (cart: CartItem[]): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

/** Provides cart state and actions to the entire application */
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(loadCartFromStorage)

  useEffect(() => {
    saveCartToStorage(cart)
  }, [cart])

  /**
   * Adds a product to the cart.
   * If the same productId + color + storage combination already exists,
   * increments its quantity instead of adding a new line.
   */
  const addToCart = (item: Omit<CartItem, 'cartItemId' | 'quantity'>): void => {
    const cartItemId = `${item.productId}-${item.color}-${item.storage}`

    setCart(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId)
      if (existing) {
        return prev.map(i => (i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...item, cartItemId, quantity: 1 }]
    })
  }

  /** Increases quantity of a cart item by 1 */
  const increaseQuantity = (cartItemId: string): void => {
    setCart(prev =>
      prev.map(i => (i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i))
    )
  }

  /**
   * Decreases quantity of a cart item by 1.
   * Removes the item entirely if quantity reaches 0.
   */
  const decreaseQuantity = (cartItemId: string): void => {
    setCart(prev =>
      prev
        .map(i => (i.cartItemId === cartItemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter(i => i.quantity > 0)
    )
  }

  /** Removes a cart item entirely regardless of quantity */
  const removeFromCart = (cartItemId: string): void => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId))
  }

  /** Clears all items from the cart */
  const clearCart = (): void => {
    setCart([])
  }

  /** Total number of units across all cart items */
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)

  /** Total price of all cart items (price × quantity per item) */
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

/**
 * Hook to consume the CartContext
 * @throws Error if used outside of CartProvider
 */
export const useCartContext = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCartContext must be used within CartProvider')
  return context
}
