/**
 * جسم مقطع C — **محلّلٌ يُحمَّل كسولاً**.
 *
 * ستّة مقاطع C في المنهج كلِّه (لغة المرساة)، ومحلّلها `@lezer/cpp` أثقل من
 * محلّل Dart نفسه. فلا تحمله الأقاليم الواحدُ والعشرون التي لا تعرض C.
 */
import { highlightToHtml as paintC } from '@t3lm/kit/highlight/c';

export default function CBody({ code }: { code: string }) {
  return <pre className="code__body en" dangerouslySetInnerHTML={{ __html: paintC(code, 'c') }} />;
}
