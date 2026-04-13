import { Router, type Request, type Response } from 'express'
import sharp from 'sharp'

const router = Router()

/**
 * Removes the white background from an image using a flood-fill from every edge pixel.
 * Only white/near-white pixels connected to the border become transparent,
 * preserving any white elements inside the product itself.
 *
 * @param data   - Raw RGBA pixel buffer (4 bytes per pixel)
 * @param width  - Image width in pixels
 * @param height - Image height in pixels
 * @param threshold - How close to white a pixel must be to be considered background (0–255)
 */
const removeWhiteBackground = (
  data: Buffer,
  width: number,
  height: number,
  threshold = 240
): Buffer => {
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength)
  const visited = new Uint8Array(width * height)

  const isBackground = (pos: number): boolean => {
    const i = pos * 4
    return pixels[i] >= threshold && pixels[i + 1] >= threshold && pixels[i + 2] >= threshold
  }

  // BFS queue seeded from all four edges
  const queue: number[] = []

  for (let x = 0; x < width; x++) {
    queue.push(x)                          // top row
    queue.push((height - 1) * width + x)   // bottom row
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push(y * width)                  // left column
    queue.push(y * width + (width - 1))    // right column
  }

  while (queue.length > 0) {
    const pos = queue.pop()!
    if (visited[pos] || !isBackground(pos)) continue

    visited[pos] = 1
    pixels[pos * 4 + 3] = 0 // transparent

    const x = pos % width
    const y = Math.floor(pos / width)

    if (x > 0) queue.push(pos - 1)
    if (x < width - 1) queue.push(pos + 1)
    if (y > 0) queue.push(pos - width)
    if (y < height - 1) queue.push(pos + width)
  }

  return Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)
}

/** GET /api/image?url=<imageUrl> */
router.get('/', async (req: Request, res: Response) => {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing required query param: url' })
    return
  }

  try {
    const upstream = await fetch(url)

    if (!upstream.ok) {
      res.status(502).json({ error: `Failed to fetch image: ${upstream.status}` })
      return
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())

    // Decode to raw RGBA pixels
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const cleaned = removeWhiteBackground(data, info.width, info.height)

    // Crop to content bounding box, then fix height at 400px
    const processed = await sharp(cleaned, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim()
      .resize({ height: 400, withoutEnlargement: false })
      .webp({ lossless: true })
      .toBuffer()

    res
      .set('Content-Type', 'image/webp')
      .set('Cache-Control', 'public, max-age=31536000')
      .send(processed)
  } catch {
    res.status(500).json({ error: 'Failed to process image' })
  }
})

export default router
