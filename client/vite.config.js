import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to Express
      '/api': {
        target:      'http://localhost:3000',
        changeOrigin: true,
        // Uncomment if your backend uses self-signed SSL in dev:
        // secure: false,
      },
      // Proxy Socket.io WebSocket connections
      '/socket.io': {
        target:      'http://localhost:3000',
        ws:          true,
        changeOrigin: true,
      },
    },
  },
  build: {
    // Warn if any chunk exceeds 500kb
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large dependencies into separate chunks
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-leaflet': ['leaflet'],
          'vendor-socket': ['socket.io-client'],
        },
      },
    },
  },
});
