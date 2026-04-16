import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { CartItem, CartContextType } from '@/features/cart/types/cart.types'

/** Clave de localStorage usada para persistir el carrito entre sesiones */
const CART_STORAGE_KEY = 'zara_cart'

/** Contexto de React que almacena el estado y las acciones del carrito */
const CartContext = createContext<CartContextType | null>(null)

/**
 * Carga el carrito persistido desde localStorage.
 * Devuelve un array vacío si no hay datos o si el parseo falla.
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
 * Persiste el array del carrito actual en localStorage.
 * @param cart - Los artículos del carrito a guardar
 */
const saveCartToStorage = (cart: CartItem[]): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

/** Provee el estado y las acciones del carrito a toda la aplicación */
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(loadCartFromStorage)

  useEffect(() => {
    saveCartToStorage(cart)
  }, [cart])

  /**
   * Añade un producto al carrito como una nueva línea.
   */
  const addToCart = (item: Omit<CartItem, 'cartItemId'>): void => {
    const cartItemId = crypto.randomUUID()
    setCart(prev => [...prev, { ...item, cartItemId }])
  }

  /** Elimina un artículo del carrito */
  const removeFromCart = (cartItemId: string): void => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId))
  }

  /** Vacía todos los artículos del carrito */
  const clearCart = (): void => {
    setCart([])
  }

  /** Número total de artículos en el carrito */
  const totalItems = cart.length

  /** Precio total de todos los artículos del carrito */
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
 * Hook para consumir el CartContext
 * @throws Error si se usa fuera de CartProvider
 */
export const useCartContext = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCartContext must be used within CartProvider')
  return context
}
