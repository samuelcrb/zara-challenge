import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PhoneDetail from '@/features/products/page/PhoneDetail/PhoneDetail'
import { CartProvider } from '@/features/cart/CartContext'
import { TransitionProvider } from '@/context/transitionContext'
import useProductDetail from '@/features/products/hooks/useProductDetail'
import type {
  ProductDetail,
  ColorOption,
  StorageOption,
} from '@/features/products/types/product.types'

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/features/products/hooks/useProductDetail')
vi.mock('@/utils/image.utils', () => ({
  getImageUrl: (url: string) => url,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// ─── Factories ─────────────────────────────────────────────────────────────────

const makeColor = (overrides: Partial<ColorOption> = {}): ColorOption => ({
  name: 'Black',
  hexCode: '#000000',
  imageUrl: 'https://example.com/black.jpg',
  ...overrides,
})

const makeStorage = (overrides: Partial<StorageOption> = {}): StorageOption => ({
  capacity: '128GB',
  price: 999,
  ...overrides,
})

const makeDetail = (overrides: Partial<ProductDetail> = {}): ProductDetail => ({
  id: 'APPLE-1',
  brand: 'Apple',
  name: 'iPhone 15',
  basePrice: 999,
  imageUrl: 'https://example.com/iphone.jpg',
  renderKey: 'APPLE-1-0',
  description: 'Great phone',
  rating: 4.5,
  specs: {
    screen: '6.1"',
    resolution: '2556x1179',
    processor: 'A16 Bionic',
    mainCamera: '48MP',
    selfieCamera: '12MP',
    battery: '3279mAh',
    os: 'iOS 17',
    screenRefreshRate: '60Hz',
  },
  colorOptions: [
    makeColor({ name: 'Black', hexCode: '#000000', imageUrl: 'https://example.com/black.jpg' }),
    makeColor({ name: 'White', hexCode: '#FFFFFF', imageUrl: 'https://example.com/white.jpg' }),
  ],
  storageOptions: [
    makeStorage({ capacity: '128GB', price: 999 }),
    makeStorage({ capacity: '256GB', price: 1099 }),
  ],
  similarProducts: [],
  ...overrides,
})

// ─── Default hook return ───────────────────────────────────────────────────────

const mockHandleColorSelect = vi.fn()
const mockHandleStorageSelect = vi.fn()

const defaultHook = (): ReturnType<typeof useProductDetail> => ({
  product: makeDetail(),
  isLoading: false,
  error: null,
  selectedColor: null,
  selectedStorage: null,
  currentPrice: 999,
  currentImageUrl: 'https://example.com/black.jpg',
  canAddToCart: false,
  handleColorSelect: mockHandleColorSelect,
  handleStorageSelect: mockHandleStorageSelect,
})

// ─── Render helper ─────────────────────────────────────────────────────────────

const onLoadingChange = vi.fn()

const renderDetail = (hookOverrides: Partial<ReturnType<typeof useProductDetail>> = {}) => {
  vi.mocked(useProductDetail).mockReturnValue({ ...defaultHook(), ...hookOverrides })
  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={['/product/APPLE-1']}>
      <CartProvider>
        <TransitionProvider value="forward">
          <PhoneDetail onLoadingChange={onLoadingChange} />
        </TransitionProvider>
      </CartProvider>
    </MemoryRouter>,
  )
  return { ...utils, user }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PhoneDetail page', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockHandleColorSelect.mockReset()
    mockHandleStorageSelect.mockReset()
    localStorage.clear()
  })

  // ─── Loading / error states ──────────────────────────────────────────────────

  it('renders nothing when isLoading is true', () => {
    const { container } = renderDetail({ isLoading: true, product: null })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the error message when error is set', () => {
    renderDetail({ isLoading: false, product: null, error: 'Product not found' })
    expect(screen.getByText('Product not found')).toBeInTheDocument()
  })

  // ─── Product info ────────────────────────────────────────────────────────────

  it('renders the product brand and name as a heading', () => {
    renderDetail()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Apple iPhone 15')
  })

  it('shows "From X EUR" label when no storage is selected', () => {
    renderDetail({ selectedStorage: null, currentPrice: 999 })
    expect(screen.getByText('From 999 EUR')).toBeInTheDocument()
  })

  it('shows "X EUR" label when storage is selected', () => {
    renderDetail({
      selectedStorage: makeStorage({ capacity: '128GB', price: 999 }),
      currentPrice: 999,
    })
    expect(screen.getByText('999 EUR')).toBeInTheDocument()
    expect(screen.queryByText(/From/)).not.toBeInTheDocument()
  })

  // ─── Specs ───────────────────────────────────────────────────────────────────

  it('renders the SPECIFICATIONS heading', () => {
    renderDetail()
    expect(screen.getByRole('heading', { name: 'SPECIFICATIONS' })).toBeInTheDocument()
  })

  it('renders all spec rows', () => {
    renderDetail()
    const specs = ['Screen', 'Resolution', 'Processor', 'Main Camera', 'Selfie Camera', 'Battery', 'OS', 'Screen Refresh Rate']
    specs.forEach(label => expect(screen.getByText(label)).toBeInTheDocument())
  })

  it('renders brand and name rows in the specs table', () => {
    renderDetail()
    // Brand and Name are spec rows too
    expect(screen.getByText('Brand')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  // ─── Storage options ─────────────────────────────────────────────────────────

  it('renders a button for each storage option', () => {
    renderDetail()
    expect(screen.getByRole('button', { name: '128GB' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '256GB' })).toBeInTheDocument()
  })

  it('calls handleStorageSelect when a storage option is clicked', async () => {
    const { user } = renderDetail()
    await user.click(screen.getByRole('button', { name: '128GB' }))
    expect(mockHandleStorageSelect).toHaveBeenCalledWith(
      expect.objectContaining({ capacity: '128GB' }),
    )
  })

  // ─── Color options ────────────────────────────────────────────────────────────

  it('renders a button for each color option', () => {
    renderDetail()
    expect(screen.getByRole('button', { name: 'Black' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'White' })).toBeInTheDocument()
  })

  it('calls handleColorSelect when a color swatch is clicked', async () => {
    const { user } = renderDetail()
    await user.click(screen.getByRole('button', { name: 'Black' }))
    expect(mockHandleColorSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Black' }),
    )
  })

  // ─── Add to cart ──────────────────────────────────────────────────────────────

  it('renders the ADD TO CART button disabled when canAddToCart is false', () => {
    renderDetail({ canAddToCart: false })
    expect(screen.getByRole('button', { name: 'ADD TO CART' })).toBeDisabled()
  })

  it('renders the ADD TO CART button enabled when canAddToCart is true', () => {
    renderDetail({ canAddToCart: true })
    expect(screen.getByRole('button', { name: 'ADD TO CART' })).toBeEnabled()
  })

  it('navigates to /cart after clicking ADD TO CART', async () => {
    const { user } = renderDetail({
      canAddToCart: true,
      selectedColor: makeColor(),
      selectedStorage: makeStorage(),
    })
    await user.click(screen.getByRole('button', { name: 'ADD TO CART' }))
    expect(mockNavigate).toHaveBeenCalledWith('/cart')
  })

  // ─── Back button ──────────────────────────────────────────────────────────────

  it('calls navigate(-1) when the BACK button is clicked', async () => {
    const { user } = renderDetail()
    await user.click(screen.getByRole('button', { name: /BACK/i }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})
