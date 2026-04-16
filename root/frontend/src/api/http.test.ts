import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'

/**
 * http.ts captura VITE_BASE_URL en el momento de carga del módulo, por lo que hay que:
 *  1. Hacer stub de la variable de entorno
 *  2. Resetear módulos para que http.ts se reevalúe con el valor stub
 *  3. Importar dinámicamente la copia recién cargada
 */
describe('http client', () => {
  let http: (endpoint: string, options?: Record<string, unknown>) => Promise<unknown>

  beforeAll(async () => {
    vi.stubEnv('VITE_BASE_URL', 'http://localhost:3000')
    vi.resetModules()
    const mod = await import('@/api/http')
    http = mod.default as typeof http
  })

  afterAll(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  const okResponse = (data: unknown): Response =>
    ({ ok: true, status: 200, json: () => Promise.resolve(data) }) as Response

  const errorResponse = (status: number, body: unknown): Response =>
    ({ ok: false, status, json: () => Promise.resolve(body) }) as Response

  // ─── Construcción de URL ───────────────────────────────────────────────────

  it('calls fetch with the base URL + endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse([]))
    await http('/products')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/products',
      expect.any(Object),
    )
  })

  it('appends query params to the URL', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse([]))
    await http('/products', { params: { search: 'iphone', limit: 20 } })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('search=iphone')
    expect(url).toContain('limit=20')
  })

  it('skips undefined param values', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse([]))
    await http('/products', { params: { search: undefined, limit: 10 } })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).not.toContain('search')
    expect(url).toContain('limit=10')
  })

  it('skips empty-string param values', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse([]))
    await http('/products', { params: { search: '', limit: 10 } })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).not.toContain('search=')
  })

  // ─── Éxito ─────────────────────────────────────────────────────────────────

  it('returns parsed JSON on a 200 response', async () => {
    const data = [{ id: '1', name: 'iPhone 15' }]
    vi.mocked(fetch).mockResolvedValue(okResponse(data))
    const result = await http('/products')
    expect(result).toEqual(data)
  })

  it('sets the Content-Type: application/json header', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse({}))
    await http('/products')
    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('forwards the AbortSignal to fetch', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse({}))
    const { signal } = new AbortController()
    await http('/products', { signal })
    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(options.signal).toBe(signal)
  })

  // ─── Gestión de errores ────────────────────────────────────────────────────

  it('throws with the server error message on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse(404, { message: 'Product not found' }))
    await expect(http('/products/999')).rejects.toThrow('Product not found')
  })

  it('throws a fallback message when the error body has no message field', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse(500, {}))
    await expect(http('/products')).rejects.toThrow('HTTP error: 500')
  })
})
