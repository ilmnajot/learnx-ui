import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin in the browser, so the HttpOnly SameSite=Strict refresh cookie just works.
    proxy: { '/api': 'http://localhost:8080' },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
