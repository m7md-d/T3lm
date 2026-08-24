import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@t3lm/kit/styles/reset.css';
/* المحرّر والطرفية يرثان الهوية — لا قيمة لون واحدة في العدّة، والتخصيص
   في `tokens.css` بعدهما فيفوز الأخصُّ والأحدث. */
import '@t3lm/kit/editor/editor.css';
import '@t3lm/kit/editor/derive.css';
import '@t3lm/kit/terminal/terminal.css';
import '@t3lm/kit/terminal/derive.css';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
