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

  it('empieza con un carrito vacío', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    expect(result.current.cart).toHaveLength(0)
  })

  it('añade un artículo al carrito', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    expect(result.current.cart).toHaveLength(1)
  })

  it('añade una nueva fila al añadir el mismo producto de nuevo', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart(mockItem))
    expect(result.current.cart).toHaveLength(2)
  })

  it('cada entrada del carrito obtiene un cartItemId único', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart(mockItem))
    const [a, b] = result.current.cart
    expect(a.cartItemId).not.toBe(b.cartItemId)
  })

  it('añade una nueva fila para una configuración diferente', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart({ ...mockItem, storage: '256GB' }))
    expect(result.current.cart).toHaveLength(2)
  })

  it('elimina un artículo del carrito', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.removeFromCart(result.current.cart[0].cartItemId))
    expect(result.current.cart).toHaveLength(0)
  })

  it('calcula totalItems correctamente', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart(mockItem))
    expect(result.current.totalItems).toBe(2)
  })

  it('calcula totalPrice correctamente', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    act(() => result.current.addToCart(mockItem))
    expect(result.current.totalPrice).toBe(909 * 2)
  })

  it('persiste el carrito en localStorage', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => result.current.addToCart(mockItem))
    const stored = JSON.parse(localStorage.getItem('zara_cart') ?? '[]')
    expect(stored).toHaveLength(1)
  })

  it('carga el carrito persistido desde localStorage al montar', () => {
    const cartItemId = 'some-uuid'
    localStorage.setItem(
      'zara_cart',
      JSON.stringify([{ ...mockItem, cartItemId }]),
    )
    const { result } = renderHook(() => useCartContext(), { wrapper })
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].cartItemId).toBe(cartItemId)
  })

  it('devuelve un carrito vacío cuando localStorage contiene JSON inválido', () => {
    localStorage.setItem('zara_cart', 'not-valid-json')
    const { result } = renderHook(() => useCartContext(), { wrapper })
    expect(result.current.cart).toHaveLength(0)
  })

  it('clearCart elimina todos los artículos', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper })
    act(() => {
      result.current.addToCart(mockItem)
      result.current.addToCart({ ...mockItem, storage: '256GB' })
    })
    expect(result.current.cart).toHaveLength(2)
    act(() => result.current.clearCart())
    expect(result.current.cart).toHaveLength(0)
  })

  it('lanza un error cuando useCartContext se usa fuera de CartProvider', () => {
    // Suprime la salida de consola esperada del error boundary de React
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useCartContext())).toThrow(
      'useCartContext must be used within CartProvider',
    )
    spy.mockRestore()
  })
})
