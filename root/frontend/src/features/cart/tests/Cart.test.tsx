import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider, useCartContext } from '@/features/cart/CartContext'
import { TransitionProvider } from '@/context/transitionContext'
import Cart from '@/features/cart/page/Cart/Cart'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    h1: ({ children, className }: { children: ReactNode; className?: string }) => (
      <h1 className={className}>{children}</h1>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/PageTransition/PageTransition', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock('@/utils/image.utils', () => ({
  getImageUrl: (url: string) => url,
}))

// ─── Helpers ───────────────────────────────────────────────────────────────────

const cartWrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>
    <MemoryRouter initialEntries={['/cart']}>
      <TransitionProvider value="forward">{children}</TransitionProvider>
    </MemoryRouter>
  </CartProvider>
)

const mockItem = {
  productId: '1',
  name: 'iPhone 15',
  brand: 'Apple',
  imageUrl: 'https://example.com/image.jpg',
  color: 'Black',
  storage: '128GB',
  price: 999,
}

/** Renders the Cart page with an optional pre-populated cart */
const renderCart = (items: typeof mockItem[] = []) => {
  const hookResult = renderHook(() => useCartContext(), { wrapper: cartWrapper })
  items.forEach(item => act(() => hookResult.result.current.addToCart(item)))

  const user = userEvent.setup()
  const utils = render(<Cart />, { wrapper: cartWrapper })
  return { ...utils, user }
}

beforeEach(() => {
  localStorage.clear()
})

describe('Cart page', () => {
  // ─── Empty state ─────────────────────────────────────────────────────────────

  it('shows CART (0) in the title when the cart is empty', () => {
    renderCart()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CARRITO')
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders no list items when the cart is empty', () => {
    renderCart()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  // ─── Cart with items ──────────────────────────────────────────────────────────

  it('renders each cart item with name, storage | color and price', () => {
    renderCart([mockItem])
    const listItem = screen.getByRole('listitem')
    expect(within(listItem).getByText('iPhone 15')).toBeInTheDocument()
    expect(within(listItem).getByText(/128GB/)).toBeInTheDocument()
    expect(within(listItem).getByText(/Black/)).toBeInTheDocument()
    expect(within(listItem).getByText('999 EUR')).toBeInTheDocument()
  })

  it('renders two rows when the same product is added twice', () => {
    renderCart([mockItem, mockItem])
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('shows the total price', () => {
    renderCart([mockItem, { ...mockItem, storage: '256GB', price: 1099 }])
    // Both items: 999 + 1099 = 2098
    expect(screen.getAllByText(/2098 EUR/).length).toBeGreaterThan(0)
  })

  // ─── Navigation ───────────────────────────────────────────────────────────────

  it('renders the CONTINUE SHOPPING button', () => {
    renderCart()
    expect(screen.getByRole('button', { name: 'SEGUIR COMPRANDO' })).toBeInTheDocument()
  })

  // ─── Remove item ──────────────────────────────────────────────────────────────

  it('renders an "Eliminar" button for each item', () => {
    renderCart([mockItem])
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
  })
})
