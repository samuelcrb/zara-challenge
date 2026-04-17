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
  it('renders the brand name', () => {
    renderCard()
    expect(screen.getByText('Apple')).toBeInTheDocument()
  })

  it('renders the product name', () => {
    renderCard()
    expect(screen.getByText('iPhone 15')).toBeInTheDocument()
  })

  it('renders the price in EUR', () => {
    renderCard()
    expect(screen.getByText('999,00 EUR')).toBeInTheDocument()
  })

  it('renders a decimal price with Spanish format', () => {
    renderCard(makeProduct({ basePrice: 99.9 }))
    expect(screen.getByText('99,90 EUR')).toBeInTheDocument()
  })

  it('has an accessible label combining brand, name and price', () => {
    renderCard()
    expect(screen.getByLabelText('Apple iPhone 15, 999,00 EUR')).toBeInTheDocument()
  })

  it('links to /product/:id', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/product/APPLE-1')
  })

  it('renders the product image with a proxied src', () => {
    renderCard()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute(
      'src',
      'http://proxy/image?url=https%3A%2F%2Fexample.com%2Fiphone.jpg',
    )
  })

  it('uses brand + name as the image alt text', () => {
    renderCard()
    expect(screen.getByAltText('Apple iPhone 15')).toBeInTheDocument()
  })
})
