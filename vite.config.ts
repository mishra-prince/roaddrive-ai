import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cesium static assets (widgets) are copied to /cesium so the viewer works
// without any CDN or API key. window.CESIUM_BASE_URL is set in main.tsx.
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['findlaw-moves-urban-estates.trycloudflare.com'],
  },
  build: {
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        // Cesium is huge — keep it in its own lazy chunk, loaded only when
        // the admin 3D map mounts. Static assets live in public/cesium.
        manualChunks: (id) => {
          if (id.includes('cesium')) return 'cesium';
        },
      },
    },
  },
});
