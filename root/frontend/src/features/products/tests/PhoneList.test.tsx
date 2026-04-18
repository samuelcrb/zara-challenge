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

// ─── Factorías ─────────────────────────────────────────────────────────────────

const makeProduct = (id: string): Product => ({
  id,
  brand: 'Brand',
  name: `Phone ${id}`,
  basePrice: 100,
  imageUrl: `https://example.com/${id}.jpg`,
  renderKey: id,
})

const defaultHook = (): ReturnType<typeof useProducts> => ({
  products: [],
  isLoading: false,
  error: null,
  search: '',
  setSearch: vi.fn(),
  fetchId: 1,
})

// ─── Auxiliar de renderizado ───────────────────────────────────────────────────

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

describe('página PhoneList', () => {
  beforeEach(() => {
    onLoadingChange.mockReset()
    clearProductCache()
  })

  // ─── onLoadingChange ──────────────────────────────────────────────────────────

  it('llama a onLoadingChange(true) cuando isLoading es true', () => {
    renderList({ isLoading: true })
    expect(onLoadingChange).toHaveBeenCalledWith(true)
  })

  it('llama a onLoadingChange(false) cuando isLoading es false', () => {
    renderList({ isLoading: false })
    expect(onLoadingChange).toHaveBeenCalledWith(false)
  })

  // ─── Estado de error ──────────────────────────────────────────────────────────

  it('muestra el mensaje de error dentro de una alerta cuando error está definido', () => {
    renderList({ error: 'Something went wrong' })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong')
  })

  it('no renderiza la barra de búsqueda cuando hay un error', () => {
    renderList({ error: 'Oops' })
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  // ─── Contenido ────────────────────────────────────────────────────────────────

  it('renderiza la barra de búsqueda una vez revelado el contenido', async () => {
    // fetchId=1 activa la revelación del contenido; direction='backward' lo muestra al instante
    renderList({ isLoading: false, products: [], fetchId: 1 })
    // La revelación del contenido requiere que pase CONTENT_REVEAL_DELAY; usar backward
    // En su lugar, renderizar con TransitionProvider value="backward" para revelado inmediato
    // (re-render para aislar):
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

  it('renderiza la lista de productos con los artículos correctos', async () => {
    const products = [makeProduct('A'), makeProduct('B')]
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook(), products })
    render(
      <MemoryRouter>
        <TransitionProvider value="backward">
          <PhoneList onLoadingChange={vi.fn()} />
        </TransitionProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('list', { name: 'Lista de productos' })).toBeInTheDocument()
  })

  it('muestra el recuento de resultados de la barra de búsqueda', () => {
    const products = [makeProduct('X'), makeProduct('Y'), makeProduct('Z')]
    vi.mocked(useProducts).mockReturnValue({ ...defaultHook(), products })
    render(
      <MemoryRouter>
        <TransitionProvider value="backward">
          <PhoneList onLoadingChange={vi.fn()} />
        </TransitionProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('3 resultados')).toBeInTheDocument()
  })
})

// ─── Filtro por color ──────────────────────────────────────────────────────────

describe('PhoneList — filtro por color', () => {
  beforeEach(() => {
    onLoadingChange.mockReset()
    clearProductCache()
  })

  // 'OPP-A18' → solo azul  |  'XMI-13TPro' → solo negro  (de PRODUCT_COLORS)
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

  it('muestra el botón FILTRAR inicialmente', () => {
    renderWithProducts([])
    expect(screen.getByText('FILTRAR')).toBeInTheDocument()
  })

  it('abre el panel de colores al hacer clic en FILTRAR', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    expect(screen.getByText('CERRAR')).toBeInTheDocument()
    expect(screen.getByLabelText('Azul')).toBeInTheDocument()
  })

  it('cierra el panel y actualiza la etiqueta tras seleccionar un color', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))
    expect(screen.queryByText('CERRAR')).not.toBeInTheDocument()
    expect(screen.getByText('FILTRAR (1)')).toBeInTheDocument()
  })

  it('muestra el botón de limpiar tras seleccionar un color', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('incrementa el contador al seleccionar un segundo color', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))
    await user.click(screen.getByText('FILTRAR (1)'))
    await user.click(screen.getByLabelText('Verde'))
    expect(screen.getByText('FILTRAR (2)')).toBeInTheDocument()
  })

  it('deselecciona un color al hacer clic de nuevo', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))
    await user.click(screen.getByText('FILTRAR (1)'))
    await user.click(screen.getByLabelText('Azul'))
    expect(screen.getByText('FILTRAR')).toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('limpia todos los colores seleccionados al hacer clic en ✕', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))
    await user.click(screen.getByText('✕'))
    expect(screen.getByText('FILTRAR')).toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('no abre el panel al hacer clic en ✕', async () => {
    const user = userEvent.setup()
    renderWithProducts([])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))
    await user.click(screen.getByText('✕'))
    expect(screen.queryByText('CERRAR')).not.toBeInTheDocument()
  })

  it('filtra el recuento de resultados por el color seleccionado', async () => {
    const user = userEvent.setup()
    // OPP-A18 → solo azul, XMI-13TPro → solo negro
    renderWithProducts([makeProduct('OPP-A18'), makeProduct('XMI-13TPro')])
    expect(screen.getByText('2 resultados')).toBeInTheDocument()
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))
    expect(screen.getByText('1 resultado')).toBeInTheDocument()
  })

  it('restaura el recuento completo tras limpiar el filtro de color', async () => {
    const user = userEvent.setup()
    renderWithProducts([makeProduct('OPP-A18'), makeProduct('XMI-13TPro')])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))
    await user.click(screen.getByText('✕'))
    expect(screen.getByText('2 resultados')).toBeInTheDocument()
  })

  it('cuenta los productos que coinciden con alguno de los colores seleccionados', async () => {
    const user = userEvent.setup()
    // OPP-A18 → azul, XMI-13TPro → negro, OPP-R11F → azul+verde
    renderWithProducts([makeProduct('OPP-A18'), makeProduct('XMI-13TPro'), makeProduct('OPP-R11F')])
    await user.click(screen.getByText('FILTRAR'))
    await user.click(screen.getByLabelText('Azul'))  // coincide con OPP-A18, OPP-R11F
    await user.click(screen.getByText('FILTRAR (1)'))
    await user.click(screen.getByLabelText('Negro')) // añade XMI-13TPro
    expect(screen.getByText('3 resultados')).toBeInTheDocument()
  })
})
