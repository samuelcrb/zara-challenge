import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCartContext } from '@/features/cart/CartContext'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>

const mockItem = {
  productId: '1',
  name: 'iPhone 12',
  brand: 'Apple',
  imageUrl: 'https://example.com/image.jpg',
  color: 'Black',
  storage: '128GB',
  price: 909,
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty cart', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    expect(result.current.cart).toHaveLength(0)
  })

  it('adds an item to the cart', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    expect(result.current.cart).toHaveLength(1)
  })

  it('increments quantity when adding the same configuration', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart(mockItem))
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].quantity).toBe(2)
  })

  it('adds a new line for different configuration', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart({ ...mockItem, storage: '256GB' }))
    expect(result.current.cart).toHaveLength(2)
  })

  it('removes an item from the cart', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.removeFromCart(result.current.cart[0].cartItemId))
    expect(result.current.cart).toHaveLength(0)
  })

  it('decreases quantity and removes item when quantity reaches 0', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.decreaseQuantity(result.current.cart[0].cartItemId))
    expect(result.current.cart).toHaveLength(0)
  })

  it('calculates totalItems correctly', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart(mockItem))
    expect(result.current.totalItems).toBe(2)
  })

  it('calculates totalPrice correctly', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart(mockItem))
    expect(result.current.totalPrice).toBe(909 * 2)
  })

  it('persists cart to localStorage', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    const stored = JSON.parse(localStorage.getItem('zara_cart') ?? '[]')
    expect(stored).toHaveLength(1)
  })

  it('loads persisted cart from localStorage on mount', () => {
    // Pre-populate localStorage before mounting
    const cartItemId = `${mockItem.productId}-${mockItem.color}-${mockItem.storage}`
    localStorage.setItem(
      'zara_cart',
      JSON.stringify([{ ...mockItem, cartItemId, quantity: 3 }]),
    )
    const { result } = renderHook(() => useCartContext(), { wrapper })
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].quantity).toBe(3)
  })

  it('returns empty cart when localStorage contains invalid JSON', () => {
    localStorage.setItem('zara_cart', 'not-valid-json')
    const { result } = renderHook(() => useCartContext(), { wrapper })
    expect(result.current.cart).toHaveLength(0)
  })

  it('increaseQuantity adds one to an existing item', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    const { cartItemId } = result.current.cart[0]
    act(() => result.current.increaseQuantity(cartItemId))
    expect(result.current.cart[0].quantity).toBe(2)
  })

  it('clearCart removes all items', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => {
      result.current.addToCart(mockItem)
      result.current.addToCart({ ...mockItem, storage: '256GB' })
    })
    expect(result.current.cart).toHaveLength(2)
    act(() => result.current.clearCart())
    expect(result.current.cart).toHaveLength(0)
  })

  it('throws when useCartContext is used outside CartProvider', () => {
    // Suppress the expected React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useCartContext())).toThrow(
      'useCartContext must be used within CartProvider',
    )
    spy.mockRestore()
  })
})
