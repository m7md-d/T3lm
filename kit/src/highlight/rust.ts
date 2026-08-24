/**
 * تلوين Rust — انظر `@t3lm/kit/highlight` للميكانيزم والقاعدة.
 *
 * **المحلّل يُستورَد من `@lezer/rust` مباشرةً، لا من `@codemirror/lang-rust`:**
 * الثاني يجرّ `@codemirror/language` ومعها بيئة المحرّر، ولا حاجة إليها في عرضٍ
 * ساكن.
 */
import { parser } from '@lezer/rust';
import { escapeOnly, highlightWith } from './index';

/** `lang` وسيطٌ للتناسق مع مصدرٍ فيه لغاتٌ عدّة؛ ما ليس `rust` يُهرَّب فقط. */
export function highlightToHtml(code: string, lang = 'rust'): string {
  return lang === 'rust' ? highlightWith(parser, code) : escapeOnly(code);
}
