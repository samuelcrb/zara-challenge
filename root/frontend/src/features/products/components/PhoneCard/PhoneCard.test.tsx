import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PhoneCard from '@/features/products/components/PhoneCard/PhoneCard'
import type { Product } from '@/features/products/types/product.types'

vi.mock('@/utils/image.utils', () => ({
  getImageUrl: (url: string) => `http://proxy/image?url=${encodeURIComponent(url)}`,
}))

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'APPLE-1',
  brand: 'Apple',
  name: 'iPhone 15',
  basePrice: 999,
  imageUrl: 'https://example.com/iphone.jpg',
  renderKey: 'APPLE-1-0',
  ...overrides,
})

const renderCard = (product: Product = makeProduct()) =>
  render(
    <MemoryRouter>
      <PhoneCard product={product} />
    </MemoryRouter>,
  )

describe('PhoneCard', () => {
  it('renderiza el nombre de la marca', () => {
    renderCard()
    expect(screen.getByText('Apple')).toBeInTheDocument()
  })

  it('renderiza el nombre del producto', () => {
    renderCard()
    expect(screen.getByText('iPhone 15')).toBeInTheDocument()
  })

  it('renderiza el precio en EUR', () => {
    renderCard()
    expect(screen.getByText('999,00 EUR')).toBeInTheDocument()
  })

  it('renderiza un precio decimal con formato español', () => {
    renderCard(makeProduct({ basePrice: 99.9 }))
    expect(screen.getByText('99,90 EUR')).toBeInTheDocument()
  })

  it('tiene una etiqueta accesible que combina marca, nombre y precio', () => {
    renderCard()
    expect(screen.getByLabelText('Apple iPhone 15, 999,00 EUR')).toBeInTheDocument()
  })

  it('enlaza a /product/:id', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/product/APPLE-1')
  })

  it('renderiza la imagen del producto con un src a través del proxy', () => {
    renderCard()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute(
      'src',
      'http://proxy/image?url=https%3A%2F%2Fexample.com%2Fiphone.jpg',
    )
  })

  it('usa marca + nombre como texto alternativo de la imagen', () => {
    renderCard()
    expect(screen.getByAltText('Apple iPhone 15')).toBeInTheDocument()
  })
})
