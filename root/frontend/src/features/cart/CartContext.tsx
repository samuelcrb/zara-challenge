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
   * Adds a product to the cart as a new row.
   */
  const addToCart = (item: Omit<CartItem, 'cartItemId'>): void => {
    const cartItemId = crypto.randomUUID()
    setCart(prev => [...prev, { ...item, cartItemId }])
  }

  /** Removes a cart item entirely */
  const removeFromCart = (cartItemId: string): void => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId))
  }

  /** Clears all items from the cart */
  const clearCart = (): void => {
    setCart([])
  }

  /** Total number of items in the cart */
  const totalItems = cart.length

  /** Total price of all cart items */
  const totalPrice = cart.reduce((acc, item) => acc + item.price, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
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
