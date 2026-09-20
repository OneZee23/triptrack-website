import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: { include: ['maplibre-gl'] },
  build: {
    // maplibre-gl (~1 MB minified) is inherently over the default 500 kB
    // warning limit, but it's isolated to its own lazy chunk (manualChunks
    // below + React.lazy at the GlobeHero/MapGlobe boundary) and only ever
    // fetched by routes that render the globe — never part of the entry
    // chunk any route pays for on load.
    chunkSizeWarningLimit: 1100,
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
