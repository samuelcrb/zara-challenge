/** Represents a product added to the cart with a specific configuration */
export type CartItem = {
  /** Unique identifier based on productId + color + storage combination */
  cartItemId: string
  productId: string
  name: string
  brand: string
  imageUrl: string
  color: string
  storage: string
  price: number
  quantity: number
}

/** Shape of the cart context value */
export type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'cartItemId' | 'quantity'>) => void
  removeFromCart: (cartItemId: string) => void
  increaseQuantity: (cartItemId: string) => void
  decreaseQuantity: (cartItemId: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}
