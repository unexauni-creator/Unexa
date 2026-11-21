import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Libraries change far less often than our own code, so they go in their own files:
// after a deploy, returning visitors download only the small app file again.
function vendorChunk(id) {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/.test(id)) return 'vendor-react'
  if (id.includes('@supabase')) return 'vendor-supabase'
  // framer-motion is used only on the landing page, so it stays in the landing page's own file
  return undefined
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
})
