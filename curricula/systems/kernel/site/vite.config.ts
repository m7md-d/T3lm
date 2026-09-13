import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: { exclude: ['@t3lm/kit'] },
  /* `regions/` و`appendix/` و`programs/` خارج `site/` — وهي المصدر الوحيد (الثابت ٤) */
  server: { fs: { allow: ['../..', '../../../..'] } },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1200 },
});
