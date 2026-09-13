/**
 * تلوين Assembly بصيغة GNU as — انظر `@t3lm/kit/highlight` للميكانيزم والقاعدة.
 *
 * **المحلّل من CodeMirror** (`StreamLanguage` فوق نمط `gas` القديم): لا محلّل
 * lezer للأسمبلي في المنظومة. والبديل — تعبيراتٌ نمطية مرتجَلة — يُخطئ عند أوّل
 * `%` في تعليقٍ أو أوّل `$` في قيمةٍ فورية، فيقرأ القارئ لوناً يكذب عليه.
 *
 * و`gas` من `@codemirror/legacy-modes` مضبوطٌ على x86 أصلاً، و`gasArm` نظيرُه
 * لـarm64 حيث يُعرَض للمقارنة.
 */
import { StreamLanguage } from '@codemirror/language';
import { gas, gasArm } from '@codemirror/legacy-modes/mode/gas';
import { escapeOnly, highlightWith } from './index';

const X86 = StreamLanguage.define(gas);
const ARM = StreamLanguage.define(gasArm);

export function highlightToHtml(code: string, lang = 'asm'): string {
  if (lang === 'asm' || lang === 'as' || lang === 'x86asm' || lang === 'gas') return highlightWith(X86.parser, code);
  if (lang === 'arm' || lang === 'arm64' || lang === 'aarch64') return highlightWith(ARM.parser, code);
  return escapeOnly(code);
}
