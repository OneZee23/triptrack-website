import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: { include: ['maplibre-gl'] },
  build: {
    rollupOptions: {
      output: {
        // function form avoids the React.lazy eager-load regression (Vite #17653)
        manualChunks(id) {
          if (id.includes('node_modules/maplibre-gl')) return 'maplibre'
        },
      },
    },
  },
})
