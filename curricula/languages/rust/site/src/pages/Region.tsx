import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { marked } from 'marked';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { regions, sealed } from '../lib/content';
import { buildStations, SEED } from '../lib/structure';
import { inline } from '../lib/inline';
import { store } from '../lib/store';
import Blocks from '../components/Blocks';
import Trail from '../components/Trail';

/** لقطةٌ واحدة في الشاشة، وخطوةٌ واحدة أمامها تسمّي نفسها. */
export default function Region() {
  const { num } = useParams();
  const idx = regions.findIndex((r) => r.num === num);
  const region = regions[idx];

  const shots = useMemo(
    () => (region ? buildStations(region.chapter.sections, region.num) : []),
    [region]
  );
  const [at, setAt] = useState(0);
  const [params] = useSearchParams();
  const asked = Number(params.get('s'));

  useEffect(() => {
    if (!region) return;
    const last = Math.max(0, shots.length - 1);
    setAt(Number.isInteger(asked) && asked >= 0 && asked <= last
      ? asked
      : Math.min(store.lastShot(region.num), last));
  }, [region, shots.length, asked]);

  useEffect(() => {
    if (region && shots.length) store.see(region.num, at);
  }, [region, at, shots.length]);

  if (!region) return <Navigate to="/" replace />;

  const shot = shots[at];
  const isSeed = shot?.title.startsWith(SEED);
  const partHere = [...region.chapter.parts].reverse().find((p) => p.start <= at);
  const partNext = region.chapter.parts.find((p) => p.start === at + 1);
  const next = regions[idx + 1];

  const go = (to: number) => {
    setAt(to);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="region">
      <aside className="rail">
        <Trail region={region.num} shots={shots} parts={region.chapter.parts} at={at} onGo={go} />
      </aside>

      <main className="doc">
        <header className="doc-head">
          <span className="kicker">
            {region.chapter.heading}
            {partHere && <><span className="sep" aria-hidden="true">·</span>{inline(partHere.title)}</>}
          </span>
          <h1>{inline(shot?.title ?? '')}</h1>
        </header>

        {at === 0 && region.chapter.lead && (
          <div
            className="lead prose"
            dangerouslySetInnerHTML={{ __html: marked.parse(region.chapter.lead.replace(/^> ?/gm, '')) as string }}
          />
        )}

        {partHere?.lead && partHere.start === at && (
          <div
            className="part-lead prose"
            dangerouslySetInnerHTML={{ __html: marked.parse(partHere.lead) as string }}
          />
        )}

        {shot && <Blocks blocks={shot.blocks} />}

        {isSeed ? (
          next ? (
            <Link className="seed-door" to={`/r/${next.num}`}>
              <span>{next.label} {next.num}</span>
              <b>{inline(next.title)}</b>
            </Link>
          ) : (
            <div className="seed-door sealed">
              <span><Lock size={13} /> بقيّة الطريق</span>
              <b>{sealed.map((s) => s.title).join(' · ')}</b>
            </div>
          )
        ) : (
          <nav className="pager" aria-label="التنقّل بين اللقطات">
            <button type="button" className="pager-back" disabled={at === 0} onClick={() => go(at - 1)}>
              <ArrowRight size={15} /> السابقة
            </button>
            <button type="button" className="pager-next" disabled={at >= shots.length - 1} onClick={() => go(at + 1)}>
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
