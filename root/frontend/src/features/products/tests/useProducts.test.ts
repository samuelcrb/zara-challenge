import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import useProducts from '@/features/products/hooks/useProducts'
import { getProducts } from '@/features/products/products.api'
import preloadImages from '@/utils/image.utils'
import type { Product } from '@/features/products/types/product.types'

vi.mock('@/features/products/products.api')
vi.mock('@/utils/image.utils')

const mockGetProducts = vi.mocked(getProducts)
const mockPreloadImages = vi.mocked(preloadImages)

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'APPLE-1',
  brand: 'Apple',
  name: 'iPhone 15',
  basePrice: 999,
  imageUrl: 'https://example.com/iphone.jpg',
  ...overrides,
})

describe('useProducts', () => {
  beforeEach(() => {
    mockGetProducts.mockResolvedValue([])
    mockPreloadImages.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ─── Initial state ─────────────────────────────────────────────────────────

  it('has the correct initial state before fetch resolves', () => {
    mockGetProducts.mockReturnValue(new Promise(() => {})) // never resolves → no async state updates

    const { result } = renderHook(() => useProducts())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.products).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.search).toBe('')
    expect(result.current.fetchId).toBe(0)
  })

  // ─── Successful fetch ──────────────────────────────────────────────────────

  it('sets products and turns off loading on success', async () => {
    const products = [makeProduct(), makeProduct({ id: 'SAM-1', brand: 'Samsung' })]
    mockGetProducts.mockResolvedValue(products)

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.products).toEqual(products)
    expect(result.current.error).toBeNull()
  })

  it('increments fetchId on each successful fetch', async () => {
    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.fetchId).toBe(1))
  })

  it('passes search and limit params to getProducts', async () => {
    renderHook(() => useProducts())

    await waitFor(() =>
      expect(mockGetProducts).toHaveBeenCalledWith(
        { search: '', limit: 20 },
        expect.any(AbortSignal)
      )
    )
  })

  // ─── Image preloading ──────────────────────────────────────────────────────

  it('preloads images of all returned products', async () => {
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

  it('does not set products until preload resolves', async () => {
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

  // ─── Error handling ────────────────────────────────────────────────────────

  it('sets the error message on API failure', async () => {
    mockGetProducts.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.products).toEqual([])
  })

  it('sets fallback message for non-Error throws', async () => {
    mockGetProducts.mockRejectedValue('unexpected')

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Something went wrong')
  })

  it('does not set error on AbortError', async () => {
    const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' })
    mockGetProducts.mockRejectedValue(abortError)

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeNull()
  })

  it('does not increment fetchId on error', async () => {
    mockGetProducts.mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.fetchId).toBe(0)
  })

  // ─── Search debounce ───────────────────────────────────────────────────────

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('does not fetch on every keystroke', async () => {
      const { result } = renderHook(() => useProducts())

      // Flush initial fetch
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

    it('fetches after 300ms with the latest search value', async () => {
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

    it('resets the debounce timer on each keystroke', async () => {
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

  // ─── Request cancellation ──────────────────────────────────────────────────

  describe('cancellation', () => {
    it('does not update state when unmounted before preload resolves', async () => {
      let resolvePreload!: (v: void[]) => void
      mockPreloadImages.mockReturnValue(
        new Promise(resolve => {
          resolvePreload = resolve
        })
      )
      mockGetProducts.mockResolvedValue([makeProduct()])

      const { result, unmount } = renderHook(() => useProducts())

      // Flush the initial fetch microtasks so preloadImages gets called
      await act(async () => {})

      expect(mockPreloadImages).toHaveBeenCalled()

      unmount()

      act(() => {
        resolvePreload([])
      })

      expect(result.current.products).toEqual([])
      expect(result.current.fetchId).toBe(0)
    })

    describe('with fake timers', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })
      afterEach(() => {
        vi.useRealTimers()
      })

      it('aborts the previous request when search changes', async () => {
        let firstSignal: AbortSignal | undefined
        mockGetProducts.mockImplementation((_, signal) => {
          firstSignal ??= signal // capture only the initial signal
          return new Promise(() => {}) // never resolves
        })

        const { result } = renderHook(() => useProducts())

        // Flush initial effects
        await act(async () => {})

        expect(firstSignal?.aborted).toBe(false)

        // Change search and advance past debounce; advanceTimersByTimeAsync properly
        // awaits React re-renders + effect cleanups triggered by the timer
        act(() => {
          result.current.setSearch('test')
        })
        await act(async () => {
          await vi.advanceTimersByTimeAsync(300)
        })

        expect(firstSignal?.aborted).toBe(true)
      })

      it('ignores stale preload when a newer search completes first', async () => {
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

        // Flush initial fetch — preload is now pending
        await act(async () => {})

        expect(mockPreloadImages).toHaveBeenCalledTimes(1)
        expect(result.current.products).toEqual([]) // blocked by pending preload

        // Fire a new search before first preload resolves
        act(() => {
          result.current.setSearch('new')
        })
        act(() => {
          vi.advanceTimersByTime(300)
        })
        await act(async () => {}) // second fetch runs and resolves (preload resolves too)

        expect(result.current.products[0].id).toBe('SECOND')

        // First preload resolves — should be ignored (its effect was cancelled)
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
