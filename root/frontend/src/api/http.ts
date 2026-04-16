const BASE_URL = import.meta.env.VITE_BASE_URL ?? '/api'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>
}

/**
 * Construye la URL completa con los parámetros de query añadidos
 * @param endpoint - Ruta del endpoint de la API (p.ej. '/products')
 * @param params - Parámetros de query opcionales a añadir
 * @returns URL completa con los parámetros de query
 */
const buildUrl = (
  endpoint: string,
  params?: Record<string, string | number | undefined>
): string => {
  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })
  }
  return url.toString()
}

/**
 * Cliente HTTP genérico que se comunica con la API
 * @param endpoint - Ruta del endpoint de la API (p.ej. '/products')
 * @param options - Opciones de fetch y parámetros de query opcionales
 * @returns Respuesta JSON parseada con tipo T
 * @throws Error con el mensaje de error de la API si la petición falla
 */
const http = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { params, ...fetchOptions } = options

  const url = buildUrl(endpoint, params)

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? `HTTP error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export default http
