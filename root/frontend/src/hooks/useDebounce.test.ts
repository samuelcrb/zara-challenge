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

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('does not update the value before the delay elapses', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(result.current).toBe('a')
  })

  it('updates the value after the delay elapses', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current).toBe('ab')
  })

  it('resets the timer on each new value — only the last value is applied', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200) // 200ms — timer not fired yet
    })

    rerender({ value: 'abc' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200) // another 200ms — still not 300ms since 'abc'
    })

    expect(result.current).toBe('a') // debounce not fired yet

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100) // now 300ms since 'abc'
    })

    expect(result.current).toBe('abc')
  })

  it('uses 300 ms as the default delay', async () => {
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
