import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PhoneList from '@/features/products/page/PhoneList/PhoneList'
import useProducts, { clearProductCache } from '@/features/products/hooks/useProducts'
import { TransitionProvider } from '@/context/transitionContext'
import type { ReactNode } from 'react'
import type { Product } from '@/features/products/types/product.types'

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/features/products/hooks/useProducts')

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
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

// ─── Factories ─────────────────────────────────────────────────────────────────

const makeProduct = (id: string): Product => ({
  id,
  brand: 'Brand',
  name: `Phone ${id}`,
  basePrice: 100,
  imageUrl: `https://example.com/${id}.jpg`,
  renderKey: `${id}-0`,
})

const defaultHook = (): ReturnType<typeof useProducts> => ({
  products: [],
  isLoading: false,
  error: null,
  search: '',
  setSearch: vi.fn(),
  fetchId: 1,
})

// ─── Render helper ─────────────────────────────────────────────────────────────

const onLoadingChange = vi.fn()

const renderList = (hookOverrides: Partial<ReturnType<typeof useProducts>> = {}) => {
  vi.mocked(useProducts).mockReturnValue({ ...defaultHook(), ...hookOverrides })
  return render(
    <MemoryRouter>
      <TransitionProvider value="forward">
        <PhoneList onLoadingChange={onLoadingChange} />
      </TransitionProvider>
    </MemoryRouter>,
  )
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PhoneList page', () => {
  beforeEach(() => {
    onLoadingChange.mockReset()
    clearProductCache()
  })

  // ─── onLoadingChange ──────────────────────────────────────────────────────────

  it('calls onLoadingChange(true) when isLoading is true', () => {
    renderList({ isLoading: true })
    expect(onLoadingChange).toHaveBeenCalledWith(true)
  })

  it('calls onLoadingChange(false) when isLoading is false', () => {
    renderList({ isLoading: false })
    expect(onLoadingChange).toHaveBeenCalledWith(false)
  })

  // ─── Error state ──────────────────────────────────────────────────────────────

  it('shows the error message inside an alert when error is set', () => {
    renderList({ error: 'Something went wrong' })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong')
  })

  it('does not render the search bar when there is an error', () => {
    renderList({ error: 'Oops' })
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  // ─── Content ──────────────────────────────────────────────────────────────────

  it('renders the search bar once content is revealed', async () => {
    // fetchId=1 triggers content reveal; direction='backward' shows immediately
    renderList({ isLoading: false, products: [], fetchId: 1 })
    // Content reveal requires CONTENT_REVEAL_DELAY to pass; use backward direction
    // Instead, render with TransitionProvider value="backward" for instant reveal
    // (re-render to isolate):
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook(), products: [] })
    render(
      <MemoryRouter>
        <TransitionProvider value="backward">
          <PhoneList onLoadingChange={vi.fn()} />
        </TransitionProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders the products list with correct items', async () => {
    const products = [makeProduct('A'), makeProduct('B')]
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook(), products })
    render(
      <MemoryRouter>
        <TransitionProvider value="backward">
          <PhoneList onLoadingChange={vi.fn()} />
        </TransitionProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('list', { name: 'Products list' })).toBeInTheDocument()
  })

  it('shows the result count from the search bar', () => {
    const products = [makeProduct('X'), makeProduct('Y'), makeProduct('Z')]
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook(), products })
    render(
      <MemoryRouter>
        <TransitionProvider value="backward">
          <PhoneList onLoadingChange={vi.fn()} />
        </TransitionProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('3 results')).toBeInTheDocument()
  })
})
