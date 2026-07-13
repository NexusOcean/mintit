import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@mintit/types': path.resolve(__dirname, '../../packages/types/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});
