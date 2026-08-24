/**
 * تلوين ساكن — **بلا محرّر وبلا لون**.
 *
 * يحلّل الكود بمحلّل اللغة نفسه الذي يستعمله المحرّر، ويُخرج HTML فيه أصنافٌ
 * قياسية (`tok-keyword` · `tok-string` · `tok-comment` …) من `classHighlighter`
 * في `@lezer/highlight`. **والألوان قرارُ المستورِد**: يعرّف تلك الأصناف في
 * ورقته بتوكناته هو.
 *
 * وموضعه هنا لأنه ميكانيزم يتكرّر: كل منهج لغةٍ يعرض كوداً لا يُشغَّل.
 *
 * **واللغة تُستورَد من مدخلها وحدها** — `@t3lm/kit/highlight/rust` — لئلّا يحمل
 * منهجٌ محلّل لغةٍ لا يعرضها. وهذا المدخل هو الميكانيزم المجرَّد، بلا لغة.
 */
import { classHighlighter, highlightCode } from '@lezer/highlight';
import type { Parser } from '@lezer/common';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * يُرجع HTML ملوّناً بمحلّلٍ تعطيه أنت.
 * **ولا يرمي أبداً**: مقطعٌ لا يُحلَّل يُعرَض نصّاً مهرَّباً كما هو.
 */
export function highlightWith(parser: Parser, code: string): string {
  try {
    const tree = parser.parse(code);
    let out = '';
    highlightCode(
      code,
      tree,
      classHighlighter,
      (text, classes) => {
        out += classes ? `<span class="${classes}">${esc(text)}</span>` : esc(text);
      },
      () => { out += '\n'; }
    );
    return out;
  } catch {
    return esc(code);
  }
}

/** النصّ مهرَّباً بلا تلوين — لِما لا محلّل له. */
export const escapeOnly = esc;
