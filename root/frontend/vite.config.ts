/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Producción: minificar y concatenar recursos
    // Desarrollo: omitir minificación para salida legible
    minify: mode === 'production',
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: mode === 'production'
        ? {
            // Agrupar librerías de terceros en un único chunk en producción
            manualChunks: (id) => {
              if (id.includes('node_modules')) return 'vendor'
            },
          }
        : {},
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'src/tests/setup.ts'],
    },
  },
}))
