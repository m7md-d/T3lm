import { createRoot } from 'react-dom/client';
import App from './App';

import '@t3lm/kit/styles/reset.css';
import './styles/tokens.css';               /* هوية المنهج — مصدر الحقيقة */
import './styles/app.css';

/* عامل الخدمة مولَّد بعد البناء (tools/sw.mjs) — فلا وجود له في التطوير. */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(<App />);
