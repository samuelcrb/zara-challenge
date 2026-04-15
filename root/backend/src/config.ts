const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

const config = {
  port: Number(process.env.PORT ?? 3001),
  upstreamUrl: process.env.UPSTREAM_API_URL ?? 'https://prueba-tecnica-api-tienda-moviles.onrender.com',
  apiKey: process.env.API_KEY ?? '',
  corsOrigin: rawOrigins.split(',').map(o => o.trim()),
} as const

export default config
