/**
 * الخلاصة «أين نحن في الشجرة» — ٣٢ إقليماً، ٣٠ منها بجدول
 * «ما عرفتَه \| العقدة التي يتعلّق بها».
 *
 * الشبكة **مكتوبةٌ في المصدر** عقدةً عقدة؛ الموقع يرسمها ولا يخترعها. وصفوفها
 * هي أيضاً مادّة الأثر: تقدّمٌ محتوًى لا نقاط.
 */
import type { SummaryRow } from '../lib/types';
import { inline } from '../lib/md';

export function SummaryTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <div className="summary">
      {rows.map((r, i) => (
        <div className="summary__row" key={i}>
          <div className="summary__cell" dangerouslySetInnerHTML={{ __html: inline(r.learned) }} />
          <div className="summary__cell summary__cell--node" dangerouslySetInnerHTML={{ __html: inline(r.node) }} />
        </div>
      ))}
    </div>
  );
}
