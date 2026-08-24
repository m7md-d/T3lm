/**
 * تلوين Go — انظر `@t3lm/kit/highlight` للميكانيزم والقاعدة.
 *
 * **المحلّل يُستورَد من `@lezer/go` مباشرةً، لا من `@codemirror/lang-go`:**
 * الثاني يجرّ `@codemirror/language` ومعها بيئة المحرّر، ولا حاجة إليها في عرضٍ
 * ساكن.
 */
import { parser } from '@lezer/go';
import { escapeOnly, highlightWith } from './index';

/** `lang` وسيطٌ للتناسق مع مصدرٍ فيه لغاتٌ عدّة؛ ما ليس `go` يُهرَّب فقط. */
export function highlightToHtml(code: string, lang = 'go'): string {
  return lang === 'go' ? highlightWith(parser, code) : escapeOnly(code);
}
