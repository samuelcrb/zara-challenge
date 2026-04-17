import { Router, type Request, type Response } from 'express'
import { processImage } from '../imageProcessor.js'

const router = Router()

/** GET /api/image?url=<imageUrl> — Devuelve la imagen procesada en formato webp */
router.get('/', async (req: Request, res: Response) => {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing required query param: url' })
    return
  }

  try {
    const processed = await processImage(url)

    res
      .set('Content-Type', 'image/webp')
      .set('Cache-Control', 'public, max-age=31536000')
      .send(processed)
  } catch {
    res.status(500).json({ error: 'Failed to process image' })
  }
})

export default router
