/** Representa un producto añadido al carrito */
export type CartItem = {
  /** Identificador único de esta entrada del carrito */
  cartItemId: string
  productId: string
  name: string
  brand: string
  imageUrl: string
  color: string
  storage: string
  price: number
}

/** Forma del valor del contexto del carrito */
export type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'cartItemId'>) => void
  removeFromCart: (cartItemId: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}
