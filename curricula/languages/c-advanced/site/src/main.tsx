import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* عاملُ الخدمة يجعله يُثبَّت تطبيقاً ويعمل بلا شبكة. ويُفحَص في الزيارة
   الثانية — الأولى لا تفحصه لأنه لم يسيطر بعد (`tools/swcheck.mjs`). */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
