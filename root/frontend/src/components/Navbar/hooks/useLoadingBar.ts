import { useEffect, useReducer, useRef } from 'react'
import { BAR_COMPLETE_DURATION } from '@/constants/animation'
import { reducer, initialState } from './useLoadingBar.reducer'
import type { BarPhase } from './useLoadingBar.reducer'

/**
 * Controls the loading bar animation phase based on a loading state.
 * @param isLoading - Whether the app is currently loading
 * @returns barPhase and barWidth for animation
 */
const useLoadingBar = (isLoading: boolean) => {
  const [{ barPhase, barWidth, cycle }, dispatch] = useReducer(reducer, initialState)
  const phaseRef = useRef<BarPhase>('idle')

  useEffect(() => {
    if (isLoading) {
      phaseRef.current = 'loading'
      dispatch({ type: 'start' })
      return
    }

    if (phaseRef.current !== 'loading') return

    phaseRef.current = 'completing'
    dispatch({ type: 'complete' })
    const timer = setTimeout(() => {
      phaseRef.current = 'idle'
      dispatch({ type: 'idle' })
    }, BAR_COMPLETE_DURATION)

    return () => clearTimeout(timer)
  }, [isLoading])

  // Trigger the grow transition after the bar mounts at width 0
  useEffect(() => {
    if (barPhase !== 'loading') return
    const frame = requestAnimationFrame(() => dispatch({ type: 'grow' }))
    return () => cancelAnimationFrame(frame)
  }, [barPhase, cycle])

  return { barPhase, barWidth }
}

export default useLoadingBar
