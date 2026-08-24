import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { runnoLocal } from './scripts/runno-local';

export default defineConfig(({ mode }) => ({
  build: {
    rollupOptions: {
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        /* صفحةُ فحصِ زرّ التشغيل — أداةُ مؤلّفٍ لا صفحةُ قارئ. تُبنى حين
           يطلبها `npm run runno` وحدها، فلا تُنشَر ولا يخزّنها عامل الخدمة. */
        ...(mode === 'runno'
          ? { 'runno-check': new URL('./runno-check.html', import.meta.url).pathname }
          : {}),
      },
    },
  },
  base: './',                       // يعمل في الجذر وفي مجلد فرعي سواء
  plugins: [react(), runnoLocal()],
  optimizeDeps: { exclude: ['@t3lm/kit'] },
  server: { fs: { allow: ['../..', '../../../..'] } },  // الماركداون خارج site/
}));
