import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// ─── Color filter ──────────────────────────────────────────────────────────────

describe('PhoneList — color filter', () => {
  beforeEach(() => {
    onLoadingChange.mockReset()
    clearProductCache()
  })

  // 'OPP-A18' → blue only  |  'XMI-13TPro' → black only  (from PRODUCT_COLORS)
  const renderWithProducts = (products: Product[]) => {
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook(), products })
    return render(
      <MemoryRouter>
        <TransitionProvider value="backward">
          <PhoneList onLoadingChange={vi.fn()} />
        </TransitionProvider>
      </MemoryRouter>,
    )
  }

  it('shows FILTRAR button initially', () => {
    renderWithProducts([])
    expect(screen.getByText('FILTRAR')).toBeInTheDocument()
  })

  it('opens the color panel when clicking FILTRAR', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    expect(screen.getByText('CERRAR')).toBeInTheDocument()
    expect(screen.getByLabelText('Blue')).toBeInTheDocument()
  })

  it('closes the panel and updates the label after selecting a color', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))
    expect(screen.queryByText('CERRAR')).not.toBeInTheDocument()
    expect(screen.getByText('FILTRAR (1)')).toBeInTheDocument()
  })

  it('shows the clear button after selecting a color', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('increments the count when a second color is selected', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))
    await user.click(screen.getByText('FILTRAR (1)'))
    await user.click(screen.getByLabelText('Green'))
    expect(screen.getByText('FILTRAR (2)')).toBeInTheDocument()
  })

  it('deselects a color when clicking it again', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))
    await user.click(screen.getByText('FILTRAR (1)'))
    await user.click(screen.getByLabelText('Blue'))
    expect(screen.getByText('FILTRAR')).toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('clears all selected colors when clicking ✕', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))
    await user.click(screen.getByText('✕'))
    expect(screen.getByText('FILTRAR')).toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('does not open the panel when clicking ✕', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))
    await user.click(screen.getByText('✕'))
    expect(screen.queryByText('CERRAR')).not.toBeInTheDocument()
  })

  it('filters the result count by selected color', async () => {
    const user = userEvent.setup()
    // OPP-A18 → blue only, XMI-13TPro → black only
    renderWithProducts([makeProduct('OPP-A18'), makeProduct('XMI-13TPro')])
    expect(screen.getByText('2 results')).toBeInTheDocument()
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))
    expect(screen.getByText('1 result')).toBeInTheDocument()
  })

  it('restores the full count after clearing the color filter', async () => {
    const user = userEvent.setup()
    renderWithProducts([makeProduct('OPP-A18'), makeProduct('XMI-13TPro')])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))
    await user.click(screen.getByText('✕'))
    expect(screen.getByText('2 results')).toBeInTheDocument()
  })

  it('counts products matching any of the selected colors', async () => {
    const user = userEvent.setup()
    // OPP-A18 → blue, XMI-13TPro → black, OPP-R11F → blue+green
    renderWithProducts([makeProduct('OPP-A18'), makeProduct('XMI-13TPro'), makeProduct('OPP-R11F')])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Blue'))  // matches OPP-A18, OPP-R11F
    await user.click(screen.getByText('FILTRAR (1)'))
    await user.click(screen.getByLabelText('Black')) // adds XMI-13TPro
    expect(screen.getByText('3 results')).toBeInTheDocument()
  })
})
