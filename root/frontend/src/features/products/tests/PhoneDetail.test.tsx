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

// ─── Factorías ─────────────────────────────────────────────────────────────────

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

// ─── Valor de retorno del hook por defecto ─────────────────────────────────────

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

// ─── Auxiliar de renderizado ───────────────────────────────────────────────────

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

describe('página PhoneDetail', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockHandleColorSelect.mockReset()
    mockHandleStorageSelect.mockReset()
    localStorage.clear()
  })

  // ─── Estados de carga / error ────────────────────────────────────────────────

  it('no renderiza nada cuando isLoading es true', () => {
    const { container } = renderDetail({ isLoading: true, product: null })
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza el mensaje de error cuando error está definido', () => {
    renderDetail({ isLoading: false, product: null, error: 'Product not found' })
    expect(screen.getByText('Product not found')).toBeInTheDocument()
  })

  // ─── Información del producto ────────────────────────────────────────────────

  it('renderiza la marca y el nombre del producto como encabezado', () => {
    renderDetail()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Apple iPhone 15')
  })

  it('muestra la etiqueta "Desde X EUR" cuando no hay almacenamiento seleccionado', () => {
    renderDetail({ selectedStorage: null, currentPrice: 999 })
    expect(screen.getByText('Desde 999,00 EUR')).toBeInTheDocument()
  })

  it('muestra la etiqueta "X EUR" cuando hay almacenamiento seleccionado', () => {
    renderDetail({
      selectedStorage: makeStorage({ capacity: '128GB', price: 999 }),
      currentPrice: 999,
    })
    expect(screen.getByText('999,00 EUR')).toBeInTheDocument()
    expect(screen.queryByText(/From/)).not.toBeInTheDocument()
  })

  it('muestra el precio decimal con 2 decimales', () => {
    renderDetail({ selectedStorage: null, currentPrice: 99.9 })
    expect(screen.getByText('Desde 99,90 EUR')).toBeInTheDocument()
  })

  // ─── Especificaciones ────────────────────────────────────────────────────────

  it('renderiza el encabezado ESPECIFICACIONES', () => {
    renderDetail()
    expect(screen.getByRole('heading', { name: 'ESPECIFICACIONES' })).toBeInTheDocument()
  })

  it('renderiza todas las filas de especificaciones', () => {
    renderDetail()
    const specs = ['Pantalla', 'Resolución', 'Procesador', 'Cámara principal', 'Cámara frontal', 'Batería', 'Sistema operativo', 'Tasa de refresco']
    specs.forEach(label => expect(screen.getByText(label)).toBeInTheDocument())
  })

  it('renderiza las filas de marca y nombre en la tabla de especificaciones', () => {
    renderDetail()
    // Marca y Nombre también son filas de especificaciones
    expect(screen.getByText('Marca')).toBeInTheDocument()
    expect(screen.getByText('Nombre')).toBeInTheDocument()
  })

  // ─── Opciones de almacenamiento ──────────────────────────────────────────────

  it('renderiza un botón por cada opción de almacenamiento', () => {
    renderDetail()
    expect(screen.getByRole('button', { name: '128GB' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '256GB' })).toBeInTheDocument()
  })

  it('llama a handleStorageSelect al hacer clic en una opción de almacenamiento', async () => {
    const { user } = renderDetail()
    await user.click(screen.getByRole('button', { name: '128GB' }))
    expect(mockHandleStorageSelect).toHaveBeenCalledWith(
      expect.objectContaining({ capacity: '128GB' }),
    )
  })

  // ─── Opciones de color ────────────────────────────────────────────────────────

  it('renderiza un botón por cada opción de color', () => {
    renderDetail()
    expect(screen.getByRole('button', { name: 'Black' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'White' })).toBeInTheDocument()
  })

  it('llama a handleColorSelect al hacer clic en una muestra de color', async () => {
    const { user } = renderDetail()
    await user.click(screen.getByRole('button', { name: 'Black' }))
    expect(mockHandleColorSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Black' }),
    )
  })

  // ─── Añadir al carrito ────────────────────────────────────────────────────────

  it('renderiza el botón AÑADIR AL CARRITO deshabilitado cuando canAddToCart es false', () => {
    renderDetail({ canAddToCart: false })
    expect(screen.getByRole('button', { name: 'AÑADIR AL CARRITO' })).toBeDisabled()
  })

  it('renderiza el botón AÑADIR AL CARRITO habilitado cuando canAddToCart es true', () => {
    renderDetail({ canAddToCart: true })
    expect(screen.getByRole('button', { name: 'AÑADIR AL CARRITO' })).toBeEnabled()
  })

  it('navega a /cart tras hacer clic en AÑADIR AL CARRITO', async () => {
    const { user } = renderDetail({
      canAddToCart: true,
      selectedColor: makeColor(),
      selectedStorage: makeStorage(),
    })
    await user.click(screen.getByRole('button', { name: 'AÑADIR AL CARRITO' }))
    expect(mockNavigate).toHaveBeenCalledWith('/cart')
  })

  // ─── Botón de volver ──────────────────────────────────────────────────────────

  it('llama a navigate(-1) al hacer clic en el botón ATRÁS', async () => {
    const { user } = renderDetail()
    await user.click(screen.getByRole('button', { name: /ATRÁS/i }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  // ─── Artículos similares ──────────────────────────────────────────────────────

  it('renderiza la sección ARTÍCULOS SIMILARES cuando similarProducts no está vacío', () => {
    const similar: ProductDetail['similarProducts'] = [
      { id: 'SAM-1', brand: 'Samsung', name: 'Galaxy S24', basePrice: 899, imageUrl: 'https://example.com/s24.jpg', renderKey: 'SAM-1-0' },
    ]
    renderDetail({ product: makeDetail({ similarProducts: similar }) })
    expect(screen.getByRole('heading', { name: 'ARTÍCULOS SIMILARES' })).toBeInTheDocument()
  })

  it('no renderiza la sección ARTÍCULOS SIMILARES cuando similarProducts está vacío', () => {
    renderDetail({ product: makeDetail({ similarProducts: [] }) })
    expect(screen.queryByRole('heading', { name: 'ARTÍCULOS SIMILARES' })).not.toBeInTheDocument()
  })

  // ─── Producto no encontrado ───────────────────────────────────────────────────

  it('no renderiza nada cuando product es null y no está cargando', () => {
    const { container } = renderDetail({ product: null, error: null, isLoading: false })
    expect(container).toBeEmptyDOMElement()
  })
})
