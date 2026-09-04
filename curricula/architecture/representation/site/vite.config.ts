import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: { exclude: ['@t3lm/kit'] },
  /* الماركداون والأمثلة خارج `site/` — المصدر الوحيد للمحتوى (الثابت ٤) */
  server: { fs: { allow: ['../..', '../../../..'] } },
});
