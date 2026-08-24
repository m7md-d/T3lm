/**
 * تلوين C — انظر `@t3lm/kit/highlight` للميكانيزم والقاعدة.
 *
 * **المحلّل `@lezer/cpp`**: لا محلّل C خالصاً في المنظومة، وC مجموعةٌ جزئية من
 * قواعد C++ فيما يخصّ التلوين. والفرق الذي قد يظهر — `class` و`template` —
 * لا يقع في هذا المنهج، ومقطعٌ لا يُحلَّل يُعرَض نصّاً كما هو ولا يرمي.
 */
import { parser } from '@lezer/cpp';
import { escapeOnly, highlightWith } from './index';

export function highlightToHtml(code: string, lang = 'c'): string {
  return lang === 'c' ? highlightWith(parser, code) : escapeOnly(code);
}
