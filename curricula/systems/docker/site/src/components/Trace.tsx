/**
 * الأثر — **محتوًى لا نقاط**: كل لقطةٍ مكتملةٍ تترك سطراً ممّا هُدم من اعتقادات،
 * وصفوفه هي «ما عرفتَه» من جداول الخلاصة.
 *
 * ولا أعداد إجمالية ولا نسبٌ ولا سلاسل ولا عدٌّ تنازليّ (الركيزة ١٠): الشريط
 * المعتاد يعرض الكلفة كاملةً قبل البدء، والأثر يعدّ من حيث بدأ.
 */
import { inline } from '../lib/md';

export interface TraceRow { from: string; what: string }

export function Trace({ rows }: { rows: TraceRow[] }) {
  if (rows.length === 0) return <p className="trace__empty">لم يُعبَر شيءٌ بعد.</p>;
  return (
    <div className="trace">
      {rows.map((r, i) => (
        <div className="tracerow" key={i}>
          <span className="tracerow__from">{r.from}</span>
          <span className="tracerow__what" dangerouslySetInnerHTML={{ __html: inline(r.what) }} />
        </div>
      ))}
    </div>
  );
}
