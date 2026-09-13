/**
 * التلوين بمحلّل CodeMirror — لا بتعبيراتٍ نمطية (الركيزة ٨ج).
 * و`asm` أُضيف إلى العدّة لأجل هذا المنهج: سبعةُ بلوكاتٍ فيه ولا محلّل أسمبلي
 * في المنظومة قبله.
 */
import { highlightToHtml as c } from '@t3lm/kit/highlight/c';
import { highlightToHtml as asm } from '@t3lm/kit/highlight/asm';
import { highlightToHtml as sh } from '@t3lm/kit/highlight/sh';
import { escapeOnly } from '@t3lm/kit/highlight';

const cache = new Map<string, string>();

export function highlight(code: string, lang: string): string {
  const key = `${lang} ${code}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let out: string;
  if (lang === 'c' || lang === 'h' || lang === 'ld') out = c(code, 'c');
  else if (lang === 'asm' || lang === 'S') out = asm(code, 'asm');
  else if (lang === 'bash' || lang === 'sh' || lang === 'shell') out = sh(code, 'sh');
  else out = escapeOnly(code);
  cache.set(key, out);
  return out;
}

/** لغةُ ملفٍّ من امتداده — للمصدر الكامل حين يُفتَح. */
export const langOfFile = (p: string): string =>
  p.endsWith('.S') ? 'asm' : p.endsWith('.ld') ? 'ld' : 'c';
