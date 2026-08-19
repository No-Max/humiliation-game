import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@humiliation-game/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 3220,
    proxy: {
      '/api': 'http://localhost:3200',
      '/uploads': 'http://localhost:3200',
    },
  },
});
