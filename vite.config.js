import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({plugins: [react(), tailwindcss()], test: {environment: 'jsdom', setupFiles: './src/test/setup.js', css: true, coverage: {provider: 'v8', include: ['src/lib/**', 'src/components/**'], reporter: ['text', 'html']}}});
