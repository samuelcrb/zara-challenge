/** Represents a product added to the cart */
export type CartItem = {
  /** Unique identifier for this cart entry */
  cartItemId: string
  productId: string
  name: string
  brand: string
  imageUrl: string
  color: string
  storage: string
  price: number
}

/** Shape of the cart context value */
export type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'cartItemId'>) => void
  removeFromCart: (cartItemId: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}
