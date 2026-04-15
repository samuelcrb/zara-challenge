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
    // Production: minify and concatenate assets
    // Development: skip minification for readable output
    minify: mode === 'production',
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: mode === 'production'
        ? {
            // Concatenate vendor libs into a single chunk in production
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
