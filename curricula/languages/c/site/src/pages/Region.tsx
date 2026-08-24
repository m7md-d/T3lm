import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { marked } from 'marked';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { regions } from '../lib/content';
import { buildShots } from '../lib/structure';
import { inline } from '../lib/inline';
import { store } from '../lib/store';
import Blocks from '../components/Blocks';
import Trail from '../components/Trail';
import { Who } from '../components/Who';

/** لقطةٌ واحدة في الشاشة، وخطوةٌ واحدة أمامها تسمّي نفسها. */
export default function Region() {
  const { num } = useParams();
  const idx = regions.findIndex((r) => r.num === num);
  const region = regions[idx];

  const shots = useMemo(
    () => (region ? buildShots(region.chapter.sections, region.num) : []),
    [region],
  );

  const [params] = useSearchParams();
  const asked = Number(params.get('s'));

  /* تُقرأ في التهيئة لا في أثرٍ بعد التركيب: الأثر لا يعمل في التصيير خارج
     المتصفّح، فكان `?s=` يعطي اللقطة الأولى دائماً — ولا يراه إلا الفحص. */
  const pick = () => {
    if (!region) return 0;
    const last = Math.max(0, shots.length - 1);
    return Number.isInteger(asked) && asked >= 0 && asked <= last
      ? asked
      : Math.min(store.lastShot(region.num), last);
  };
  const [at, setAt] = useState(pick);
  useEffect(() => { setAt(pick()); /* eslint-disable-next-line */ }, [region, shots.length, asked]);

  useEffect(() => {
    if (region && shots.length) store.see(region.num, at);
  }, [region, at, shots.length]);

  if (!region) return <Navigate to="/" replace />;

  const shot = shots[at];
  const partHere = [...region.chapter.parts].reverse().find((p) => p.start <= at);
  const partNext = region.chapter.parts.find((p) => p.start === at + 1);
  const next = regions[idx + 1];

  const go = (to: number) => { setAt(to); window.scrollTo({ top: 0 }); };

  return (
    <div className="region">
      <aside className="rail">
        <Trail region={region.num} shots={shots} parts={region.chapter.parts} at={at} onGo={go} />
        {shot && <Who auths={shot.auths} />}
      </aside>

      <main className="doc">
        <header className="doc-head">
          <span className="kicker">
            {inline(region.chapter.heading)}
            {partHere && <><span className="sep" aria-hidden="true">·</span>{inline(partHere.title)}</>}
          </span>
          <h1>{inline(shot?.title ?? region.title)}</h1>
        </header>

        {at === 0 && region.chapter.lead && (
          <div
            className="lead prose"
            dangerouslySetInnerHTML={{
              __html: marked.parse(region.chapter.lead.replace(/^> ?/gm, '')) as string,
            }}
          />
        )}

        {partHere?.lead && partHere.start === at && (
          <div
            className="part-lead prose"
            dangerouslySetInnerHTML={{ __html: marked.parse(partHere.lead) as string }}
          />
        )}

        {shot && <Blocks blocks={shot.blocks} />}

        {at >= shots.length - 1 && next ? (
          <Link className="seed-door" to={`/r/${next.num}`}>
            <span>{next.label} {next.num}</span>
            <b>{inline(next.title)}</b>
          </Link>
        ) : (
          <nav className="pager" aria-label="التنقّل بين اللقطات">
            <button type="button" className="pager-back" disabled={at === 0} onClick={() => go(at - 1)}>
              <ArrowRight size={15} /> السابقة
            </button>
            <button
              type="button" className="pager-next"
              disabled={at >= shots.length - 1} onClick={() => go(at + 1)}
            >
              <span>
                {partNext && <i className="pager-part">{inline(partNext.title)}</i>}
                <b>{inline(shots[at + 1]?.title ?? '')}</b>
              </span>
              <ArrowLeft size={15} />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
