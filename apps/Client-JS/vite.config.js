import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  optimizeDeps: {
    exclude: ['lucide'],
  },
  server: {
    port: 3001,
    open: true
  }
});
