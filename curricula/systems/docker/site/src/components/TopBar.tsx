/**
 * الشريط: أين أنت، وشريطٌ **للّقطة وحدها**. لا عدد إجماليٍّ ولا نسبةَ إنجاز.
 * وهو شفّافٌ عمداً فيمرّ المتن تحته؛ واللوح القائم بذاته لا يمرّ.
 */
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { inline } from '../lib/md';

export function TopBar({ where, progress }: { where?: string; progress?: number }) {
  return (
    <>
      <header className="topbar">
        <Link className="topbar__home" to="/">
          <Layers aria-hidden width={17} height={17} />
          <span>دوكر من البدائيات</span>
        </Link>
        {where ? <span className="topbar__where" dangerouslySetInnerHTML={{ __html: inline(where) }} /> : null}
        <span className="topbar__spacer" />
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
