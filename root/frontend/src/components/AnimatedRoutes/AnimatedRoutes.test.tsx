import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
import type { ReactNode } from 'react'
import AnimatedRoutes from './AnimatedRoutes'

vi.mock('@/features/products/page/PhoneList/PhoneList', () => ({
  default: ({ onLoadingChange }: { onLoadingChange: (v: boolean) => void }) => {
    onLoadingChange(false)
    return <div>PhoneList</div>
  },
}))

vi.mock('@/features/products/page/PhoneDetail/PhoneDetail', () => ({
  default: ({ onLoadingChange }: { onLoadingChange: (v: boolean) => void }) => {
    onLoadingChange(false)
    return <div>PhoneDetail</div>
  },
}))

vi.mock('@/features/cart/page/Cart/Cart', () => ({
  default: () => <div>Cart</div>,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const onLoadingChange = vi.fn()

const renderRoutes = (initialPath: string) =>
  render(
    <CartProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <AnimatedRoutes onLoadingChange={onLoadingChange} />
      </MemoryRouter>
    </CartProvider>,
  )

describe('AnimatedRoutes', () => {
  it('renderiza PhoneList en /', () => {
    renderRoutes('/')
    expect(screen.getByText('PhoneList')).toBeInTheDocument()
  })

  it('renderiza PhoneDetail en /product/:id', () => {
    renderRoutes('/product/ABC-1')
    expect(screen.getByText('PhoneDetail')).toBeInTheDocument()
  })

  it('renderiza Cart en /cart', () => {
    renderRoutes('/cart')
    expect(screen.getByText('Cart')).toBeInTheDocument()
  })
})
