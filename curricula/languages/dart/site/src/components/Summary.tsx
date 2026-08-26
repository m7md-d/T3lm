/**
 * الخلاصة — واحدٌ وعشرون إقليماً بجدولٍ من **ثلاثة** أعمدة، وثالثها أرقام
 * أقاليمَ قادمة. فالجدول شبكةٌ لا تلخيص، والعمود الثالث **ملاحةٌ أمامية**:
 * بنية النصّ صارت روابط، ولا يُخترَع لها عنصرٌ جديد.
 *
 * ورؤوس الأعمدة تُقرأ من المصدر لا تُفترَض: «أين يعود» في تسعةَ عشرَ إقليماً،
 * و«أين يُستعمل بعدُ» و«أين يُفصَّل» في اثنين.
 */
import { Link } from 'react-router-dom';
import type { SummaryRow } from '../lib/types';
import { inline } from '../lib/md';
import { regionOf } from '../content/regions';

export function Summary({ head, rows }: { head: string[]; rows: SummaryRow[] }) {
  return (
    <div className="summary">
      <div className="summary__head">
        {head.map((h, i) => <span key={i}>{h}</span>)}
      </div>
      {rows.map((r, i) => (
        <div className="summary__row" key={i}>
          <div className="summary__saw" dangerouslySetInnerHTML={{ __html: inline(r.saw) }} />
          <div className="summary__axiom" dangerouslySetInnerHTML={{ __html: inline(r.axiom) }} />
          <div className="summary__next">
            {r.next.length ? (
              r.next.map((no) => {
                const to = regionOf(no);
                return to ? (
                  <Link className="rlink" to={`/r/${no}`} key={no}>
                    <span className="rlink__n num en">{no}</span>
                    <span className="rlink__t" dangerouslySetInnerHTML={{ __html: inline(to.name) }} />
                  </Link>
                ) : <span key={no} className="num en">{no}</span>;
              })
            ) : (
              <span dangerouslySetInnerHTML={{ __html: inline(r.nextRaw) }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
