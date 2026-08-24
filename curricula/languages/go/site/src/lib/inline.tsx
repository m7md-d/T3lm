/**
 * ماركداون سطريّ في نصٍّ مستخرَج من الماركداون: `كود` و**تشديد**.
 *
 * العنوان والخليّة والنبذة تُكتَب ماركداوناً لأنها في `regions/` و`README.md`
 * أوّلاً — فعرضُها نصّاً خاماً يُظهر العلامات للقارئ. يمنعه فحص الدخان.
 */
import type { ReactNode } from 'react';

export function inline(s: string): ReactNode[] {
  return s.split('`').map((part, i) => {
    if (i % 2) return <code key={i} className="en">{part}</code>;
    return (
      <span key={i}>
        {part.split('**').map((bit, j) => (j % 2 ? <b key={j}>{bit}</b> : bit))}
      </span>
    );
  });
}
