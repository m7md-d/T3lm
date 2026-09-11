/**
 * بلوك كودٍ يُقرأ ولا يُحرَّر ⇒ محلّل CodeMirror ساكناً من العدّة.
 * ولا زرّ تشغيل في هذا الموقع: انظر جدول الاشتقاق.
 */
import { highlightToHtml } from '@t3lm/kit/highlight/c';
import { escapeOnly } from '@t3lm/kit/highlight';

export function CodeBlock({ code, lang = 'c', label }: { code: string; lang?: string; label?: string }) {
  const body = lang === 'c' ? highlightToHtml(code, 'c') : escapeOnly(code);
  return (
    <figure className="code">
      {label ? <figcaption className="code-cap">{label}</figcaption> : null}
      <pre className="en"><code dangerouslySetInnerHTML={{ __html: body }} /></pre>
    </figure>
  );
}
