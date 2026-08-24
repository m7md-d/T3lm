import { createRoot } from 'react-dom/client';
import App from './App';

import '@t3lm/kit/styles/reset.css';
import './styles/tokens.css';               /* هوية المنهج — مصدر الحقيقة */
import '@t3lm/kit/editor/editor.css';
import '@t3lm/kit/editor/derive.css';
import '@t3lm/kit/terminal/terminal.css';
import '@t3lm/kit/terminal/derive.css';
import './styles/app.css';

/* عامل الخدمة مولَّد بعد البناء (tools/sw.mjs) — فلا وجود له في التطوير.
   ومفسّر Go أكبر من حدّ التخزين المسبق، فيُخزَّن عند أوّل تشغيلٍ لبلوك. */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(<App />);
