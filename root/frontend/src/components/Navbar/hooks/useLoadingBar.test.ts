import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useLoadingBar from '@/components/Navbar/hooks/useLoadingBar'
import { BAR_COMPLETE_DURATION } from '@/constants/animation'

describe('useLoadingBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── Initial state ─────────────────────────────────────────────────────────

  it('starts in the idle phase with barWidth 0', () => {
    const { result } = renderHook(() => useLoadingBar(false))
    expect(result.current.barPhase).toBe('idle')
    expect(result.current.barWidth).toBe(0)
  })

  // ─── Loading phase ─────────────────────────────────────────────────────────

  it('transitions to loading phase when isLoading becomes true', () => {
    const { result, rerender } = renderHook(({ loading }) => useLoadingBar(loading), {
      initialProps: { loading: false },
    })

    rerender({ loading: true })

    expect(result.current.barPhase).toBe('loading')
  })

  it('sets barWidth to 85 after a requestAnimationFrame when loading starts', async () => {
    const { result } = renderHook(() => useLoadingBar(true))

    // barWidth starts at 0 (before rAF fires)
    expect(result.current.barWidth).toBe(0)

    await act(async () => {
      await vi.runAllTimersAsync() // flush rAF via fake timers
    })

    expect(result.current.barWidth).toBe(85)
  })

  // ─── Completing phase ──────────────────────────────────────────────────────

  it('transitions to completing and sets barWidth 100 when isLoading becomes false', () => {
    const { result, rerender } = renderHook(({ loading }) => useLoadingBar(loading), {
      initialProps: { loading: true },
    })

    rerender({ loading: false })

    expect(result.current.barPhase).toBe('completing')
    expect(result.current.barWidth).toBe(100)
  })

  it('returns to idle after BAR_COMPLETE_DURATION', async () => {
    const { result, rerender } = renderHook(({ loading }) => useLoadingBar(loading), {
      initialProps: { loading: true },
    })

    rerender({ loading: false })

    expect(result.current.barPhase).toBe('completing')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(BAR_COMPLETE_DURATION)
    })

    expect(result.current.barPhase).toBe('idle')
  })

  // ─── Guard: no-op when not in loading phase ────────────────────────────────

  it('does not transition to completing when isLoading=false and phase is already idle', () => {
    const { result, rerender } = renderHook(({ loading }) => useLoadingBar(loading), {
      initialProps: { loading: false },
    })

    // Toggle false → false (phase was never loading)
    rerender({ loading: false })

    expect(result.current.barPhase).toBe('idle')
  })

  // ─── Cycle counter ─────────────────────────────────────────────────────────

  it('increments the cycle counter on each new loading start', async () => {
    const { result, rerender } = renderHook(({ loading }) => useLoadingBar(loading), {
      initialProps: { loading: false },
    })

    rerender({ loading: true })
    rerender({ loading: false })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BAR_COMPLETE_DURATION)
    })
    rerender({ loading: true })

    // barWidth should reset to 0 on the second loading start
    expect(result.current.barPhase).toBe('loading')
    expect(result.current.barWidth).toBe(0)
  })
})
