/**
 * الشريط: أين أنت، وشريطٌ **للّقطة وحدها**. لا عدد إجماليٍّ ولا نسبةَ إنجاز —
 * الشريط المعتاد يعدّ نحو نهايةٍ لم تُبلَغ فيعرض الكلفة كاملةً قبل البدء.
 * وهو شفّافٌ عمداً فيمرّ المتن تحته؛ واللوح القائم بذاته لا يمرّ.
 */
import { Link } from 'react-router-dom';
import { inline } from '../lib/md';
import { DartMark } from './DartMark';

export function TopBar({ where, progress }: { where?: string; progress?: number }) {
  return (
    <>
      <header className="topbar">
        <Link className="topbar__home" to="/">
          <DartMark size={20} />
          <span>Dart</span>
        </Link>
        {where ? <span className="topbar__where" dangerouslySetInnerHTML={{ __html: inline(where) }} /> : null}
        <span className="spacer" />
        <Link className="topbar__act" to="/trace">الأثر</Link>
      </header>
      {progress !== undefined ? (
        <div className="shotbar" aria-hidden>
          <div className="shotbar__fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      ) : null}
    </>
  );
}
