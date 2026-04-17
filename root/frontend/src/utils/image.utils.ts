/**
 * Devuelve la URL del proxy de imágenes BFF para una URL de origen dada.
 * Todas las imágenes deben pasar por aquí para ser normalizadas (recortadas, redimensionadas, webp).
 */
const getImageUrl = (url: string): string => {
  if (!url) return ''
  const base = import.meta.env.VITE_BASE_URL ?? '/api'
  return `${base}/image?url=${encodeURIComponent(url.replace(/^http:\/\//i, 'https://'))}`
}

/**
 * Precarga un array de URLs de imágenes en la caché del navegador.
 * Resuelve cuando todas las imágenes han cargado o fallado.
 * @param urls - Array de URLs de imágenes a precargar
 */
const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(
      url =>
        new Promise<void>(resolve => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve() // Resuelve igualmente para no bloquear por imágenes rotas
          img.src = url
        })
    )
  )
}

export { preloadImages, getImageUrl }
