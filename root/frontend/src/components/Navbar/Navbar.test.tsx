import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
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

describe('Navbar', () => {
  it('renderiza el logotipo de Zara', () => {
    renderNavbar()
    expect(screen.getByAltText('Zara')).toBeInTheDocument()
  })

  it('renderiza el enlace al carrito con 0 artículos cuando el carrito está vacío', () => {
    renderNavbar()
    expect(screen.getByLabelText('Carrito, 0 artículos')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('no renderiza el enlace al carrito en la página /cart', () => {
    renderNavbar({}, '/cart')
    expect(screen.queryByRole('link', { name: /Carrito/ })).not.toBeInTheDocument()
  })

  it('aplica la clase bordered cuando showBorder es true', () => {
    renderNavbar({ showBorder: true })
    const header = screen.getByRole('banner')
    expect(header.className).toMatch(/bordered/)
  })

  it('aplica la clase bordered cuando está en la página /cart', () => {
    renderNavbar({}, '/cart')
    const header = screen.getByRole('banner')
    expect(header.className).toMatch(/bordered/)
  })

  it('muestra la barra de carga cuando barPhase no es idle', () => {
    vi.mocked(useLoadingBar).mockReturnValue({ barPhase: 'loading', barWidth: 40 })
    renderNavbar({ isLoading: true })
    const bar = document.querySelector('[style*="width: 40%"]')
    expect(bar).toBeInTheDocument()
  })

  it('oculta la barra de carga cuando barPhase es idle', () => {
    vi.mocked(useLoadingBar).mockReturnValue({ barPhase: 'idle', barWidth: 0 })
    renderNavbar()
    const bar = document.querySelector('[style*="width: 0%"]')
    expect(bar).not.toBeInTheDocument()
  })

  it('llama a onCartClick e impide la navegación cuando se proporciona', async () => {
    const onCartClick = vi.fn()
    const user = userEvent.setup()
    renderNavbar({ onCartClick })
    await user.click(screen.getByLabelText(/Carrito/))
    expect(onCartClick).toHaveBeenCalled()
  })

  it('usa el icono de carrito inactivo cuando el carrito está vacío', () => {
    renderNavbar()
    // El ícono del carrito tiene aria-hidden="true" y alt=""
    const cartImg = document.querySelector('img[aria-hidden="true"]')
    expect(cartImg).toHaveAttribute('src', '/cart-inactive.svg')
  })
})
