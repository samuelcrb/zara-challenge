import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import useProducts, { clearProductCache } from '@/features/products/hooks/useProducts'
import { getProducts } from '@/features/products/products.api'
import { preloadImages } from '@/utils/image.utils'
import type { Product } from '@/features/products/types/product.types'

vi.mock('@/features/products/products.api')
vi.mock('@/utils/image.utils', () => ({
  preloadImages: vi.fn(),
  getImageUrl: vi.fn((url: string) => url),
}))

const mockGetProducts = vi.mocked(getProducts)
const mockPreloadImages = vi.mocked(preloadImages)

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'APPLE-1',
  brand: 'Apple',
  name: 'iPhone 15',
  basePrice: 999,
  imageUrl: 'https://example.com/iphone.jpg',
  renderKey: 'APPLE-1',
  ...overrides,
})

describe('useProducts', () => {
  beforeEach(() => {
    clearProductCache()
    mockGetProducts.mockResolvedValue([])
    mockPreloadImages.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ─── Estado inicial ────────────────────────────────────────────────────────

  it('tiene el estado inicial correcto antes de que se resuelva la petición', () => {
    mockGetProducts.mockReturnValue(new Promise(() => {})) // nunca resuelve → sin actualizaciones de estado asíncronas

    const { result } = renderHook(() => useProducts())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.products).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.search).toBe('')
    expect(result.current.fetchId).toBe(0)
  })

  // ─── Petición exitosa ──────────────────────────────────────────────────────

  it('establece products y desactiva la carga al tener éxito', async () => {
    const products = [makeProduct(), makeProduct({ id: 'SAM-1', brand: 'Samsung' })]
    mockGetProducts.mockResolvedValue(products)

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.products).toEqual(products)
    expect(result.current.error).toBeNull()
  })

  it('incrementa fetchId en cada petición exitosa', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.fetchId).toBe(1))
  })

  it('pasa los parámetros search y limit a getProducts', async () => {
    renderHook(() => useProducts())

    await waitFor(() =>
      expect(mockGetProducts).toHaveBeenCalledWith(
        { search: '', limit: 20 },
        expect.any(AbortSignal)
      )
    )
  })

  // ─── Precarga de imágenes ──────────────────────────────────────────────────

  it('precarga las imágenes de todos los productos devueltos', async () => {
    const first = makeProduct({ id: 'SAM-1', imageUrl: 'https://example.com/a.jpg' })
    const second = makeProduct({ id: 'APPLE-1', imageUrl: 'https://example.com/b.jpg' })
    mockGetProducts.mockResolvedValue([first, second])

    renderHook(() => useProducts())

    await waitFor(() =>
      expect(mockPreloadImages).toHaveBeenCalledWith([
        'https://example.com/a.jpg',
        'https://example.com/b.jpg',
      ])
    )
  })

  it('no establece products hasta que se resuelva la precarga', async () => {
    let resolvePreload!: (v: void[]) => void
    mockPreloadImages.mockReturnValue(
      new Promise(resolve => {
        resolvePreload = resolve
      })
    )
    mockGetProducts.mockResolvedValue([makeProduct()])

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(mockPreloadImages).toHaveBeenCalled())
    expect(result.current.products).toEqual([])

    act(() => {
      resolvePreload([])
    })

    await waitFor(() => expect(result.current.products).toHaveLength(1))
  })

  // ─── Acierto de caché ────────────────────────────────────────────────────

  it('devuelve los productos en caché sin llamar a getProducts de nuevo', async () => {
    const products = [makeProduct()]
    mockGetProducts.mockResolvedValue(products)

    // Primer renderizado: rellena la caché para ''
    const { unmount } = renderHook(() => useProducts())
    await waitFor(() => expect(mockGetProducts).toHaveBeenCalled())
    // Espera a que los productos estén en caché
    await waitFor(() => {
      const hook = renderHook(() => useProducts())
      return hook.result.current.fetchId === 1
    })
    unmount()
    vi.clearAllMocks()

    // Segundo renderizado: debe usar la caché, sin llamar a getProducts
    const { result: result2 } = renderHook(() => useProducts())
    await waitFor(() => expect(result2.current.isLoading).toBe(false))

    expect(mockGetProducts).not.toHaveBeenCalled()
    expect(result2.current.products).toEqual(products)
  })

  // ─── Gestión de errores ────────────────────────────────────────────────────

  it('establece el mensaje de error al fallar la API', async () => {
    mockGetProducts.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.products).toEqual([])
  })

  it('establece el mensaje de reserva para errores que no son instancias de Error', async () => {
    mockGetProducts.mockRejectedValue('unexpected')

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Something went wrong')
  })

  it('no establece error en AbortError', async () => {
    const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' })
    mockGetProducts.mockRejectedValue(abortError)

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeNull()
  })

  it('no incrementa fetchId en caso de error', async () => {
    mockGetProducts.mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.fetchId).toBe(0)
  })

  // ─── Debounce de búsqueda ─────────────────────────────────────────────────

  describe('debounce de búsqueda', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('no realiza una petición con cada pulsación de tecla', async () => {
      const { result } = renderHook(() => useProducts())

      // Vacía la petición inicial
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      vi.clearAllMocks()

      act(() => {
        result.current.setSearch('s')
      })
      act(() => {
        result.current.setSearch('sa')
      })
      act(() => {
        result.current.setSearch('sam')
      })

      expect(mockGetProducts).not.toHaveBeenCalled()
    })

    it('realiza la petición tras 300ms con el último valor de búsqueda', async () => {
      const { result } = renderHook(() => useProducts())

      await act(async () => {
        await vi.runAllTimersAsync()
      })
      vi.clearAllMocks()

      act(() => {
        result.current.setSearch('samsung')
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })

      expect(mockGetProducts).toHaveBeenCalledWith(
        { search: 'samsung', limit: 20 },
        expect.any(AbortSignal)
      )
    })

    it('reinicia el temporizador de debounce con cada pulsación de tecla', async () => {
      const { result } = renderHook(() => useProducts())

      await act(async () => {
        await vi.runAllTimersAsync()
      })
      vi.clearAllMocks()

      act(() => {
        result.current.setSearch('s')
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200)
      })
      act(() => {
        result.current.setSearch('sa')
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200)
      })

      // 400ms elapsed but debounce restarted — should not have fired yet
      expect(mockGetProducts).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })

      expect(mockGetProducts).toHaveBeenCalledOnce()
    })
  })

  // ─── Cancelación de petición ──────────────────────────────────────────────

  describe('cancelación de petición', () => {
    it('no actualiza el estado al desmontar antes de que se resuelva la precarga', async () => {
      let resolvePreload!: (v: void[]) => void
      mockPreloadImages.mockReturnValue(
        new Promise(resolve => {
          resolvePreload = resolve
        })
      )
      mockGetProducts.mockResolvedValue([makeProduct()])

      const { result, unmount } = renderHook(() => useProducts())

      // Vacía las microtareas de la petición inicial para que se llame a preloadImages
      await act(async () => {})

      expect(mockPreloadImages).toHaveBeenCalled()

      unmount()

      act(() => {
        resolvePreload([])
      })

      expect(result.current.products).toEqual([])
      expect(result.current.fetchId).toBe(0)
    })

    describe('con temporizadores falsos', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })
      afterEach(() => {
        vi.useRealTimers()
      })

      it('cancela la petición anterior cuando cambia la búsqueda', async () => {
        let firstSignal: AbortSignal | undefined
        mockGetProducts.mockImplementation((_, signal) => {
          firstSignal ??= signal // captura solo la señal inicial
          return new Promise(() => {}) // nunca resuelve
        })

        const { result } = renderHook(() => useProducts())

        // Vacía los efectos iniciales
        await act(async () => {})

        expect(firstSignal?.aborted).toBe(false)

        // Cambia la búsqueda y avanza más allá del debounce; advanceTimersByTimeAsync
        // espera correctamente los re-renders de React y las limpiezas de efecto
        act(() => {
          result.current.setSearch('test')
        })
        await act(async () => {
          await vi.advanceTimersByTimeAsync(300)
        })

        expect(firstSignal?.aborted).toBe(true)
      })

      it('ignora la precarga obsoleta cuando una búsqueda más reciente completa primero', async () => {
        let resolveFirstPreload!: (v: void[]) => void
        mockPreloadImages
          .mockReturnValueOnce(
            new Promise(resolve => {
              resolveFirstPreload = resolve
            })
          )
          .mockResolvedValue([])
        mockGetProducts
          .mockResolvedValueOnce([makeProduct({ id: 'FIRST' })])
          .mockResolvedValue([makeProduct({ id: 'SECOND' })])

        const { result } = renderHook(() => useProducts())

        // Vacía la petición inicial — la precarga está pendiente
        await act(async () => {})

        expect(mockPreloadImages).toHaveBeenCalledTimes(1)
        expect(result.current.products).toEqual([]) // bloqueado por la precarga pendiente

        // Lanza una nueva búsqueda antes de que resuelva la primera precarga
        act(() => {
          result.current.setSearch('new')
        })
        act(() => {
          vi.advanceTimersByTime(300)
        })
        await act(async () => {}) // la segunda petición se ejecuta y resuelve (la precarga también)

        expect(result.current.products[0].id).toBe('SECOND')

        // La primera precarga resuelve — debe ignorarse (su efecto fue cancelado)
        act(() => {
          resolveFirstPreload([])
        })
        await act(async () => {})

        expect(result.current.products[0].id).toBe('SECOND')
        expect(result.current.products).toHaveLength(1)
      })
    })
  })
})
