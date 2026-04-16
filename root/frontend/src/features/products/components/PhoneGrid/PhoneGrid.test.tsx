import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PhoneGrid from '@/features/products/components/PhoneGrid/PhoneGrid'
import type { Product } from '@/features/products/types/product.types'

vi.mock('@/utils/image.utils', () => ({
  getImageUrl: (url: string) => url,
}))

const makeProduct = (id: string): Product => ({
  id,
  brand: 'Brand',
  name: `Phone ${id}`,
  basePrice: 100,
  imageUrl: `https://example.com/${id}.jpg`,
  renderKey: id,
})

const renderGrid = (props: Partial<React.ComponentProps<typeof PhoneGrid>> = {}) =>
  render(
    <MemoryRouter>
      <PhoneGrid products={[]} {...props} />
    </MemoryRouter>,
  )

describe('PhoneGrid', () => {
  it('has the "Products list" accessible label', () => {
    renderGrid()
    expect(screen.getByRole('list', { name: 'Lista de productos' })).toBeInTheDocument()
  })

  it('renders one list item per product', () => {
    renderGrid({ products: [makeProduct('A'), makeProduct('B'), makeProduct('C')] })
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('renders an empty list when products array is empty', () => {
    renderGrid({ products: [] })
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('renders each product name', () => {
    renderGrid({ products: [makeProduct('SAM-1'), makeProduct('APPLE-1')] })
    expect(screen.getByText('Phone SAM-1')).toBeInTheDocument()
    expect(screen.getByText('Phone APPLE-1')).toBeInTheDocument()
  })
})
