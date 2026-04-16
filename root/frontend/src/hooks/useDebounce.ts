import { useState, useEffect } from 'react'

/**
 * Retrasa la actualización de un valor hasta que transcurre el tiempo de espera indicado.
 * Útil para evitar llamadas excesivas a la API mientras el usuario escribe.
 * @param value - El valor a debouncear
 * @param delay - Retardo en milisegundos (por defecto: 300ms)
 * @returns El valor debounceado
 */
const useDebounce = <T>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
