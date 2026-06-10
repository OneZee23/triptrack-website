import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ['three'] },
  optimizeDeps: { include: ['three', 'react-globe.gl'] },
  build: {
    rollupOptions: {
      output: {
        // function form avoids the React.lazy eager-load regression (Vite #17653)
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('react-globe.gl') || id.includes('globe.gl') || id.includes('three-globe')) return 'globe'
        },
      },
    },
  },
})
