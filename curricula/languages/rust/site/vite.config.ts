import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: { exclude: ['@t3lm/kit'] },
  server: { fs: { allow: ['../..', '../../../..'] } },  // الماركداون خارج site/
});
