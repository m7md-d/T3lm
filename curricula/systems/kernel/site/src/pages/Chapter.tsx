import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { byNum, chapters } from '../content/regions';
import { byId } from '../content/stages';
import { Blocks } from '../components/Blocks';
import { Build } from '../components/Build';
import { Rail } from '../components/Rail';
import { Artifact, Checkpoint, Traps } from '../components/Sections';
import { Prose } from '../components/Prose';
import { inline } from '../lib/md';
import { store } from '../lib/store';
import type { Panel } from '../lib/types';

export function Chapter() {
  const { num = '00' } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const c = byNum[num];
  const start = Number(loc.hash.replace('#s', '')) || 0;
  const [at, setAt] = useState(start);
  const [seen, setSeen] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const [read, setRead] = useState(0);

  useEffect(() => { setAt(Number(loc.hash.replace('#s', '')) || 0); }, [loc.hash, num]);

  useEffect(() => {
    if (!c) return;
    store.see(num, at);
    setSeen(store.furthest(num));
    /* عمودياً وحده: التمرير الأفقيّ في RTL يُزيح المتن */
    window.scrollTo({ top: Math.max((top.current?.offsetTop ?? 0) - 96, 0) });
  }, [c, num, at]);

  /* شريطُ اللقطة نفسها — لا للمنهج، ولا عدَّ تنازلياً */
  useEffect(() => {
    const on = () => {
      const el = top.current;
      if (!el) return;
      const h = el.scrollHeight - window.innerHeight;
      setRead(h <= 0 ? 1 : Math.min(1, Math.max(0, (window.scrollY - el.offsetTop) / h)));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [at, num]);

  if (!c) return <div className="wrap"><p>لا فصل بهذا الرقم.</p></div>;

  const shot = c.shots[at];
  const idx = chapters.findIndex((x) => x.num === num);
  const next = chapters[idx + 1];
  const prev = chapters[idx - 1];
  const stage = byId[num];

  const goto = (i: number) => nav(`/ch/${num}#s${i}`);

  /**
   * اللوحة العاملة التي تقابل مرحلةَ كسر.
   *
   * تُطلَب من الفصل أوّلاً ثم من المنهج كلّه — لأن الكسر قد يسبق أصله: لوحةُ
   * `16x` في الفصل `15`، وأصلُها المرحلة `16` في الفصل الذي يليه. وما لا مقابل
   * له — `01x` — يُعرَض وحده بلا زوج.
   */
  const pairWith = (p: Panel): Panel | null => {
    if (!p.stage || !/x$/.test(p.stage)) return null;
    const base = p.stage.slice(0, -1);
    return c.panels.find((q) => q.stage === base)
      ?? chapters.flatMap((x) => x.panels).find((q) => q.stage === base)
      ?? null;
  };

  const last = at >= c.shots.length - 1;

  return (
    <div className="wrap">
      <div className="ch-head">
        <span className="ch-num">الفصل <span className="num">{c.num}</span></span>
        <h1 className="ch-title" dangerouslySetInnerHTML={{ __html: inline(c.titleMd) }} />
      </div>

      {stage && <Build stage={num} />}

      <Rail shots={c.shots} at={at} furthest={seen} go={goto} />

      <div className="shot-bar" aria-hidden="true"><i style={{ width: `${read * 100}%` }} /></div>

      <div ref={top} className="shot">
        {at === 0 && c.lead.length > 0 && <Blocks blocks={c.lead} chapter={num} />}

        {shot && (
          <>
            <h2 className="shot-h">
              {shot.stage && shot.sub && <span className="stage-of">{shot.stage}</span>}
              <span dangerouslySetInnerHTML={{ __html: inline(shot.sub ?? shot.titleMd) }} />
            </h2>

            {shot.stage === 'الفخاخ التصوّرية' && c.traps.length > 0
              ? <Traps traps={c.traps} />
              : shot.stage === 'Artifact' && c.artifact.length > 0
                ? <Artifact rows={c.artifact} />
                : shot.stage === 'Checkpoint' && c.checkpoint.length > 0
                  ? <Checkpoint chapter={num} qs={c.checkpoint} />
                  : <Blocks blocks={shot.blocks} chapter={num} pairWith={pairWith} />}
          </>
        )}

        {last && c.seedHtml && (
          <div className="gate" style={{ marginTop: '2em' }}>
            <div className="gate-h">الفصل التالي</div>
            <Prose html={c.seedHtml} />
          </div>
        )}
      </div>

      <nav className="step">
        {at > 0 ? (
          <button type="button" className="step-btn step-prev" onClick={() => goto(at - 1)}>
            <span className="step-k">السابق</span>
            <span className="step-v">{c.shots[at - 1]?.stage ?? c.shots[at - 1]?.title}</span>
          </button>
        ) : prev ? (
          <Link className="step-btn step-prev" to={`/ch/${prev.num}#s${Math.max(prev.shots.length - 1, 0)}`}>
            <span className="step-k">السابق</span>
            <span className="step-v">الفصل {prev.num}</span>
          </Link>
        ) : (
          <Link className="step-btn step-prev" to="/"><span className="step-v">الواجهة</span></Link>
        )}

        {!last ? (
          <button type="button" className="step-btn step-next" onClick={() => goto(at + 1)}>
            <span className="step-k">التالي</span>
            <span className="step-v">{c.shots[at + 1]?.stage ?? c.shots[at + 1]?.title}</span>
          </button>
        ) : next ? (
          <Link className="step-btn step-next" to={`/ch/${next.num}`}>
            <span className="step-k">الفصل {next.num}</span>
            <span className="step-v" dangerouslySetInnerHTML={{ __html: inline(next.titleMd) }} />
          </Link>
        ) : (
          <Link className="step-btn step-next" to="/trail">
            <span className="step-k">وقد تمّ الطريق</span>
            <span className="step-v">أثرُك</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
