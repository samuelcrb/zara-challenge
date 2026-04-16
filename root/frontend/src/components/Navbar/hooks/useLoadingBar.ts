import { useEffect, useReducer, useRef } from 'react'
import { BAR_COMPLETE_DURATION } from '@/constants/animation'
import { reducer, initialState } from './useLoadingBar.reducer'
import type { BarPhase } from './useLoadingBar.reducer'

/**
 * Controla la fase de animación de la barra de carga según el estado de carga.
 * @param isLoading - Si la aplicación está cargando actualmente
 * @returns barPhase y barWidth para la animación
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

  // Dispara la transición de crecimiento después de que la barra se monta con ancho 0
  useEffect(() => {
    if (barPhase !== 'loading') return
    const frame = requestAnimationFrame(() => dispatch({ type: 'grow' }))
    return () => cancelAnimationFrame(frame)
  }, [barPhase, cycle])

  return { barPhase, barWidth }
}

export default useLoadingBar
