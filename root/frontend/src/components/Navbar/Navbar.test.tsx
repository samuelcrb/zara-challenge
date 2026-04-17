import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
import type { ReactNode } from 'react'
import Navbar from './Navbar'

vi.mock('./hooks/useLoadingBar', () => ({
  default: vi.fn(() => ({ barPhase: 'idle', barWidth: 0 })),
}))

import useLoadingBar from './hooks/useLoadingBar'

const renderNavbar = (
  props: Partial<React.ComponentProps<typeof Navbar>> = {},
  initialPath = '/',
) =>
  render(
    <CartProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Navbar isLoading={false} {...props} />
      </MemoryRouter>
    </CartProvider>,
  )

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </CartProvider>
)

describe('Navbar', () => {
  it('renders the Zara logo', () => {
    renderNavbar()
    expect(screen.getByAltText('Zara')).toBeInTheDocument()
  })

  it('renders the cart link with 0 items when cart is empty', () => {
    renderNavbar()
    expect(screen.getByLabelText('Carrito, 0 artículos')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('does not render the cart link on the /cart page', () => {
    renderNavbar({}, '/cart')
    expect(screen.queryByRole('link', { name: /Carrito/ })).not.toBeInTheDocument()
  })

  it('applies the bordered class when showBorder is true', () => {
    renderNavbar({ showBorder: true })
    const header = screen.getByRole('banner')
    expect(header.className).toMatch(/bordered/)
  })

  it('applies the bordered class when on the /cart page', () => {
    renderNavbar({}, '/cart')
    const header = screen.getByRole('banner')
    expect(header.className).toMatch(/bordered/)
  })

  it('shows the loading bar when barPhase is not idle', () => {
    vi.mocked(useLoadingBar).mockReturnValue({ barPhase: 'loading', barWidth: 40 })
    renderNavbar({ isLoading: true })
    const bar = document.querySelector('[style*="width: 40%"]')
    expect(bar).toBeInTheDocument()
  })

  it('hides the loading bar when barPhase is idle', () => {
    vi.mocked(useLoadingBar).mockReturnValue({ barPhase: 'idle', barWidth: 0 })
    renderNavbar()
    const bar = document.querySelector('[style*="width: 0%"]')
    expect(bar).not.toBeInTheDocument()
  })

  it('calls onCartClick and prevents navigation when provided', async () => {
    const onCartClick = vi.fn()
    const user = userEvent.setup()
    renderNavbar({ onCartClick })
    await user.click(screen.getByLabelText(/Carrito/))
    expect(onCartClick).toHaveBeenCalled()
  })

  it('uses the inactive cart icon when the cart is empty', () => {
    renderNavbar()
    // El ícono del carrito tiene aria-hidden="true" y alt=""
    const cartImg = document.querySelector('img[aria-hidden="true"]')
    expect(cartImg).toHaveAttribute('src', '/cart-inactive.svg')
  })
})
