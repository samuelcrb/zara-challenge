import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useDebounce from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve el valor inicial de inmediato', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('no actualiza el valor antes de que transcurra el retraso', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(result.current).toBe('a')
  })

  it('actualiza el valor después de que transcurra el retraso', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current).toBe('ab')
  })

  it('reinicia el temporizador con cada nuevo valor — solo se aplica el último', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200) // 200ms — temporizador aún no disparado
    })

    rerender({ value: 'abc' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200) // otros 200ms — todavía no han pasado 300ms desde 'abc'
    })

    expect(result.current).toBe('a') // debounce aún no disparado

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100) // ya han pasado 300ms desde 'abc'
    })

    expect(result.current).toBe('abc')
  })

  it('usa 300 ms como retraso por defecto', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'x' },
    })

    rerender({ value: 'y' })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(299)
    })
    expect(result.current).toBe('x')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current).toBe('y')
  })
})
