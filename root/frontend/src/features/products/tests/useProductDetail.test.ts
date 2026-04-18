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

  it('tiene el estado inicial correcto antes de que se resuelva la petición', () => {
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

  it('establece product y desactiva la carga al tener éxito', async () => {
    const product = makeProductDetail()
    mockGetProductById.mockResolvedValue(product)

    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.product).toEqual(product)
    expect(result.current.error).toBeNull()
  })

  it('llama a getProductById con el id de la URL', async () => {
    renderHook(() => useProductDetail())

    await waitFor(() => expect(mockGetProductById).toHaveBeenCalledWith('APPLE-1'))
  })

  // ─── Valores derivados ───────────────────────────────────────────────────

  it('currentPrice toma el valor de basePrice cuando no hay almacenamiento seleccionado', async () => {
    mockGetProductById.mockResolvedValue(makeProductDetail({ basePrice: 999 }))

    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currentPrice).toBe(999)
  })

  it('currentImageUrl toma la imageUrl del primer color cuando no hay color seleccionado', async () => {
    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currentImageUrl).toBe('https://example.com/black.jpg')
  })

  // ─── Selección de color ──────────────────────────────────────────────────

  it('actualiza selectedColor y currentImageUrl cuando se llama a handleColorSelect', async () => {
    const white = makeColor({ name: 'White', hexCode: '#FFFFFF', imageUrl: 'https://example.com/white.jpg' })

    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.handleColorSelect(white))

    expect(result.current.selectedColor).toEqual(white)
    expect(result.current.currentImageUrl).toBe('https://example.com/white.jpg')
  })

  // ─── Selección de almacenamiento ─────────────────────────────────────────

  it('actualiza selectedStorage y currentPrice cuando se llama a handleStorageSelect', async () => {
    const storage256 = makeStorage({ capacity: '256GB', price: 1099 })

    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.handleStorageSelect(storage256))

    expect(result.current.selectedStorage).toEqual(storage256)
    expect(result.current.currentPrice).toBe(1099)
  })

  // ─── canAddToCart ────────────────────────────────────────────────────────

  it('canAddToCart es false cuando solo hay color seleccionado', async () => {
    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.handleColorSelect(makeColor()))

    expect(result.current.canAddToCart).toBe(false)
  })

  it('canAddToCart es false cuando solo hay almacenamiento seleccionado', async () => {
    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.handleStorageSelect(makeStorage()))

    expect(result.current.canAddToCart).toBe(false)
  })

  it('canAddToCart es true cuando hay color y almacenamiento seleccionados', async () => {
    const { result } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.handleColorSelect(makeColor())
      result.current.handleStorageSelect(makeStorage())
    })

    expect(result.current.canAddToCart).toBe(true)
  })

  // ─── Cambio de id ────────────────────────────────────────────────────────

  it('restablece selectedColor y selectedStorage cuando cambia el id', async () => {
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

  it('obtiene el nuevo producto cuando cambia el id', async () => {
    const { result, rerender } = renderHook(() => useProductDetail())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    mockUseParams.mockReturnValue({ id: 'SAM-1' })
    mockGetProductById.mockResolvedValue(makeProductDetail({ id: 'SAM-1', name: 'Galaxy S24' }))
    rerender()

    await waitFor(() => expect(result.current.product?.id).toBe('SAM-1'))
    expect(mockGetProductById).toHaveBeenCalledWith('SAM-1')
  })

  // ─── Gestión de errores ──────────────────────────────────────────────────

  it('establece el mensaje de error al fallar la API', async () => {
    mockGetProductById.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Not found')
    expect(result.current.product).toBeNull()
  })

  it('establece el mensaje de reserva para errores que no son instancias de Error', async () => {
    mockGetProductById.mockRejectedValue('unexpected')

    const { result } = renderHook(() => useProductDetail())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Something went wrong')
  })

  // ─── Sin id ──────────────────────────────────────────────────────────────

  it('no llama a la API cuando id es undefined', () => {
    mockUseParams.mockReturnValue({})

    renderHook(() => useProductDetail())

    expect(mockGetProductById).not.toHaveBeenCalled()
  })
})
