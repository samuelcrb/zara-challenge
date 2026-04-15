import { useEffect, useRef, useState } from 'react'
import { BAR_COMPLETE_DURATION } from '@/constants/animation'

type BarPhase = 'idle' | 'loading' | 'completing'

/**
 * Controls the loading bar animation phase based on a loading state.
 * @param isLoading - Whether the app is currently loading
 * @returns barPhase and cycle count for animation key
 */
const useLoadingBar = (isLoading: boolean) => {
  const [barPhase, setBarPhase] = useState<BarPhase>('idle')
  const [barWidth, setBarWidth] = useState(0)
  const [cycle, setCycle] = useState(0)
  const phaseRef = useRef<BarPhase>('idle')

  const setPhase = (phase: BarPhase) => {
    phaseRef.current = phase
    setBarPhase(phase)
  }

  // Single effect depending only on isLoading — cleanup never cancels the timer prematurely
  useEffect(() => {
    if (isLoading) {
      setCycle(c => c + 1)
      setPhase('loading')
      setBarWidth(0)
      return
    }

    if (phaseRef.current !== 'loading') return

    setPhase('completing')
    setBarWidth(100)
    const timer = setTimeout(() => setPhase('idle'), BAR_COMPLETE_DURATION)
    return () => clearTimeout(timer)
  }, [isLoading])

  // Trigger the grow transition after the bar mounts at width 0
  useEffect(() => {
    if (barPhase !== 'loading') return
    const frame = requestAnimationFrame(() => setBarWidth(85))
    return () => cancelAnimationFrame(frame)
  }, [barPhase, cycle])

  return { barPhase, barWidth }
}

export default useLoadingBar
