import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@t3lm/kit/styles/reset.css';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';

/* عامل الخدمة مولَّد بعد البناء (tools/sw.mjs) — فلا وجود له في التطوير. */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
