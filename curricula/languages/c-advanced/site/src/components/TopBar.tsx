/**
 * الشريط: أين أنت الآن، ومعه شريطٌ **للقسم الذي تقرؤه وحده**.
 * لا عدد إجماليٍّ ولا نسبةَ إنجاز (`profiles/default.md` §١٢).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function useScrollFraction(on: boolean) {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!on) return;
    const go = () => {
      const h = document.documentElement;
      const span = h.scrollHeight - h.clientHeight;
      setF(span > 0 ? Math.min(1, h.scrollTop / span) : 0);
    };
    go();
    window.addEventListener('scroll', go, { passive: true });
    window.addEventListener('resize', go);
    return () => { window.removeEventListener('scroll', go); window.removeEventListener('resize', go); };
  }, [on]);
  return f;
}

export function TopBar({ where, bar = false }: { where?: string; bar?: boolean }) {
  const f = useScrollFraction(bar);
  return (
    <>
      <header className="topbar">
        <Link className="topbar-home" to="/">C المتقدّم</Link>
        {where ? <span className="topbar-where">{where}</span> : null}
        <span className="topbar-gap" />
        <Link className="topbar-act" to="/sources">من يضمن؟</Link>
        <Link className="topbar-act" to="/lab">المختبر</Link>
        <Link className="topbar-act" to="/trail">الأثر</Link>
      </header>
      {bar ? (
        <div className="readbar" aria-hidden="true">
          <div className="readbar-fill" style={{ width: `${Math.round(f * 100)}%` }} />
        </div>
      ) : null}
    </>
  );
}
