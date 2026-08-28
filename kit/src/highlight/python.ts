/**
 * تلوين Python — انظر `@t3lm/kit/highlight` للميكانيزم والقاعدة.
 *
 * **المحلّل من `@codemirror/lang-python`** (وهو lezer)، وهو نفسه الذي يستعمله
 * المحرّر، فلا يفترق البلوك المقروء عن البلوك المحرَّر.
 *
 * ومعه `c`: منهج Python يعرض نواة C على الحدّ، وبلوكاتها قليلةٌ لا تستحقّ أن
 * يحمل المنهج مدخلين. و`@lezer/cpp` هو ما يستعمله مدخل C في هذه العدّة.
 */
import { python } from '@codemirror/lang-python';
import { parser as cparser } from '@lezer/cpp';
import { escapeOnly, highlightWith } from './index';

const PY = python().language.parser;

export function highlightToHtml(code: string, lang = 'python'): string {
  if (lang === 'python' || lang === 'py') return highlightWith(PY, code);
  if (lang === 'c') return highlightWith(cparser, code);
  return escapeOnly(code);
}
