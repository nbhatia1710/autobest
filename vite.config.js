import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    warmup: { clientFiles: ['./src/main.jsx', './src/App.jsx', './src/styles.css'] },
  },
  test: {
    environment: 'jsdom',
    maxWorkers: 1,
    testTimeout: 15000,
    exclude: ['node_modules/**', 'e2e/**', 'backend/**'],
    setupFiles: './src/test/setup.js',
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/components/**'],
      reporter: ['text', 'html'],
    },
  },
});
