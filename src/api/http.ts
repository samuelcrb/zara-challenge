const BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_API_KEY

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>
}

/**
 * Builds the full URL with query params appended
 * @param endpoint - API endpoint path (e.g. '/products')
 * @param params - Optional query params to append
 * @returns Full URL string with query params
 */
const buildUrl = (
  endpoint: string,
  params?: Record<string, string | number | undefined>
): string => {
  const url = new URL(`${BASE_URL}${endpoint}`)
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
 * Generic HTTP client with automatic API key injection
 * @param endpoint - API endpoint path (e.g. '/products')
 * @param options - Optional fetch options and query params
 * @returns Parsed JSON response typed as T
 * @throws Error with the API error message if the request fails
 */
const http = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { params, ...fetchOptions } = options

  const url = buildUrl(endpoint, params)

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
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
