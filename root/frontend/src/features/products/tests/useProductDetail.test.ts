import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useParams } from 'react-router-dom'
import useProductDetail from '@/features/products/hooks/useProductDetail'
import { getProductById } from '@/features/products/products.api'
import type {
  ProductDetail,
  ColorOption,
  StorageOption,
} from '@/features/products/types/product.types'

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}))

vi.mock('@/features/products/products.api')

const mockUseParams = vi.mocked(useParams)
const mockGetProductById = vi.mocked(getProductById)

// ─── Factorías ─────────────────────────────────────────────────────────────

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

const makeProductDetail = (overrides: Partial<ProductDetail> = {}): ProductDetail => ({
  id: 'APPLE-1',
  brand: 'Apple',
  name: 'iPhone 15',
  basePrice: 999,
  imageUrl: 'https://example.com/iphone.jpg',
  renderKey: 'APPLE-1-0',
  description: 'A great phone',
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

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useProductDetail', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'APPLE-1' })
    mockGetProductById.mockResolvedValue(makeProductDetail())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ─── Estado inicial ──────────────────────────────────────────────────────

  it('has the correct initial state before fetch resolves', () => {
    mockGetProductById.mockReturnValue(new Promise(() => { })) // nunca resuelve

    const { result } = renderHook(() => useProductDetail())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.product).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.selectedColor).toBeNull()
    expect(result.current.selectedStorage).toBeNull()
    expect(result.current.canAddToCart).toBe(false)
  })

  // ─── Petición exitosa ────────────────────────────────────────────────────

  it('sets product and turns off loading on success', async () => {
    const product = makeProductDetail()
    mockGetProductById.mockResolvedValue(product)

    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.product).toEqual(product)
    expect(result.current.error).toBeNull()
  })

  it('calls getProductById with the id from the URL', async () => {
    renderHook(() => useProductDetail())

    await waitFor(() => expect(mockGetProductById).toHaveBeenCalledWith('APPLE-1'))
  })

  // ─── Valores derivados ───────────────────────────────────────────────────

  it('currentPrice defaults to basePrice when no storage is selected', async () => {
    mockGetProductById.mockResolvedValue(makeProductDetail({ basePrice: 999 }))

    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currentPrice).toBe(999)
  })

  it('currentImageUrl defaults to the first color imageUrl when no color is selected', async () => {
    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currentImageUrl).toBe('https://example.com/black.jpg')
  })

  // ─── Selección de color ──────────────────────────────────────────────────

  it('updates selectedColor and currentImageUrl when handleColorSelect is called', async () => {
    const white = makeColor({ name: 'White', hexCode: '#FFFFFF', imageUrl: 'https://example.com/white.jpg' })

    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.handleColorSelect(white))

    expect(result.current.selectedColor).toEqual(white)
    expect(result.current.currentImageUrl).toBe('https://example.com/white.jpg')
  })

  // ─── Selección de almacenamiento ─────────────────────────────────────────

  it('updates selectedStorage and currentPrice when handleStorageSelect is called', async () => {
    const storage256 = makeStorage({ capacity: '256GB', price: 1099 })

    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.handleStorageSelect(storage256))

    expect(result.current.selectedStorage).toEqual(storage256)
    expect(result.current.currentPrice).toBe(1099)
  })

  // ─── canAddToCart ────────────────────────────────────────────────────────

  it('canAddToCart is false when only color is selected', async () => {
    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.handleColorSelect(makeColor()))

    expect(result.current.canAddToCart).toBe(false)
  })

  it('canAddToCart is false when only storage is selected', async () => {
    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.handleStorageSelect(makeStorage()))

    expect(result.current.canAddToCart).toBe(false)
  })

  it('canAddToCart is true when both color and storage are selected', async () => {
    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handleColorSelect(makeColor())
      result.current.handleStorageSelect(makeStorage())
    })

    expect(result.current.canAddToCart).toBe(true)
  })

  // ─── Cambio de id ────────────────────────────────────────────────────────

  it('resets selectedColor and selectedStorage when id changes', async () => {
    const { result, rerender } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handleColorSelect(makeColor())
      result.current.handleStorageSelect(makeStorage())
    })

    expect(result.current.selectedColor).not.toBeNull()
    expect(result.current.selectedStorage).not.toBeNull()

    mockUseParams.mockReturnValue({ id: 'SAM-1' })
    mockGetProductById.mockResolvedValue(makeProductDetail({ id: 'SAM-1' }))
    rerender()

    await waitFor(() => {
      expect(result.current.selectedColor).toBeNull()
      expect(result.current.selectedStorage).toBeNull()
    })
  })

  it('fetches the new product when id changes', async () => {
    const { result, rerender } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    mockUseParams.mockReturnValue({ id: 'SAM-1' })
    mockGetProductById.mockResolvedValue(makeProductDetail({ id: 'SAM-1', name: 'Galaxy S24' }))
    rerender()

    await waitFor(() => expect(result.current.product?.id).toBe('SAM-1'))
    expect(mockGetProductById).toHaveBeenCalledWith('SAM-1')
  })

  // ─── Gestión de errores ──────────────────────────────────────────────────

  it('sets the error message on API failure', async () => {
    mockGetProductById.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Not found')
    expect(result.current.product).toBeNull()
  })

  it('sets fallback message for non-Error throws', async () => {
    mockGetProductById.mockRejectedValue('unexpected')

    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Something went wrong')
  })

  // ─── Sin id ──────────────────────────────────────────────────────────────

  it('does not call the API when id is undefined', () => {
    mockUseParams.mockReturnValue({})

    renderHook(() => useProductDetail())

    expect(mockGetProductById).not.toHaveBeenCalled()
  })
})
