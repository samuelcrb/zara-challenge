/**
 * Returns the BFF image proxy URL for a given source URL.
 * All images should go through this so they are normalised (trimmed, resized, webp).
 */
export const getImageUrl = (url: string): string => {
  const base = import.meta.env.VITE_BASE_URL
  return `${base}/image?url=${encodeURIComponent(url)}`
}

/**
 * Preloads an array of image URLs into the browser cache.
 * Resolves when all images have loaded or failed.
 * @param urls - Array of image URLs to preload
 */
const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(
      url =>
        new Promise<void>(resolve => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve() // Resolve anyway to avoid blocking on broken images
          img.src = url
        })
    )
  )
}

export default preloadImages
