import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { bySlug, regions } from '../content/index.js';
import { buildRegion } from '../lib/stations.js';
import { labsFor } from '../widgets/index.js';
import { Blocks, Doors, Gate, Locked, StressCard } from '../components/Blocks.jsx';
import Markdown from '../components/Markdown.jsx';
import { load as loadStore, markSeen, markTried } from '../lib/store.js';

/**
 * صفحة الإقليم = **محطّات**، لا صفحةٌ واحدةٌ طويلة.
 * القالب معلَنٌ في README المنهج (نبذة → لغز → درس → تمرين → خلاصة)، ومحطّة
 * الدرس تنقسم إلى خطواتٍ لأن نصّها مرقّمٌ أصلاً. لا شيء هنا يخترع بنية.
 */
export default function Region() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const region = bySlug[slug];

  const doc = useMemo(() => (region ? buildRegion(region.raw) : null), [region]);
  const labs = useMemo(() => (region ? labsFor(region.slug) : []), [region]);

  /* تسلسلٌ مسطّح للتنقّل: كل عنصرٍ محطّة أو خطوةٌ داخلها */
  const flow = useMemo(() => {
    if (!doc) return [];
    const f = [];
    doc.stations.forEach((st, i) => {
      if (st.steps) st.steps.forEach((_, k) => f.push({ i, k }));
      else f.push({ i, k: -1 });
    });
    return f;
  }, [doc]);

  const [st, setSt] = useState({ tried: {}, seen: {}, spoil: false });
  useEffect(() => setSt(loadStore()), [slug]);

  const puzzleIdx = doc ? doc.stations.findIndex((s) => s.role === 'puzzle') : -1;
  const tried = !!st.tried[slug];

  const pos = useMemo(() => {
    if (!doc) return 0;
    const s = sp.get('s');
    const k = sp.get('k');
    let idx = doc.stations.findIndex((x) => x.id === s);
    if (idx < 0) idx = 0;
    const station = doc.stations[idx];
    let step = station?.steps ? station.steps.findIndex((x) => x.id === k) : -1;
    if (station?.steps && step < 0) step = 0;
    const at = flow.findIndex((f) => f.i === idx && f.k === step);
    return at < 0 ? 0 : at;
  }, [doc, sp, flow]);

  const goto = useCallback(
    (n) => {
      if (!doc || !flow.length) return;
      const c = Math.max(0, Math.min(flow.length - 1, n));
      const { i, k } = flow[c];
      const station = doc.stations[i];
      const q = { s: station.id };
      if (k >= 0) q.k = station.steps[k].id;
      setSp(q, { replace: false });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
    },
    [doc, flow, setSp]
  );

  const cur = flow[pos] || { i: 0, k: -1 };
  const station = doc?.stations[cur.i];
  const stationLocked = puzzleIdx >= 0 && cur.i > puzzleIdx && !tried;

  useEffect(() => {
    if (station) setSt(markSeen(slug, station.id));
  }, [slug, station?.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') goto(pos + 1);
      if (e.key === 'ArrowRight') goto(pos - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pos, goto]);

  if (!region || !doc) return <Navigate to="/" replace />;

  const nextRegion = regions[region.n + 1];
  const prevRegion = regions[region.n - 1];
  const step = station?.steps ? station.steps[cur.k] : null;
  const lab = step ? labs.find((l) => step.title.includes(l.after)) : null;

  const atStart = pos === 0;
  const atEnd = pos === flow.length - 1;

  return (
    <div className="wrap" style={{ '--accent': region.color }}>
      <section className="cover" style={{ paddingBottom: 6 }}>
        <div className="eyebrow">
          الإقليم {region.id} · {region.full}
        </div>
        <h1 style={{ fontSize: 'clamp(26px,4.2vw,42px)' }}>{region.title}</h1>
        <StressCard axis={doc.lead.axis} question={doc.lead.question} />
        {doc.lead.note && (
          <div className="lede">
            <Markdown>{doc.lead.note}</Markdown>
          </div>
        )}
      </section>

      <nav className="stations" aria-label="محطّات الإقليم">
        {doc.stations.map((s, i) => {
          const locked = puzzleIdx >= 0 && i > puzzleIdx && !tried;
          const first = flow.findIndex((f) => f.i === i);
          return (
            <button
              key={s.id}
              type="button"
              className={`st${i === cur.i ? ' on' : ''}`}
              disabled={locked}
              onClick={() => goto(first)}
              title={locked ? 'مقفول حتى تحاول اللغز' : s.title}
            >
              <b>
                {locked && <span className="lk">◍ </span>}
                {s.label}
              </b>
              <em>{s.hint || `${s.steps ? `${s.steps.length} خطوات` : 'محطّة'}`}</em>
            </button>
          );
        })}
      </nav>

      <div className="budget" style={{ marginBlock: 10 }}>
        <i style={{ width: `${((pos + 1) / flow.length) * 100}%` }} />
      </div>

      {stationLocked ? (
        <Locked
          title="الدرس مقفولٌ حتى تحاول"
          note="المنهج يضع اللغز قبل الشرح عمداً: «ما ستقرأه بعد قليل يكون بلا قيمةٍ إن لم يكن عندك جوابٌ يُكسر». ارجع إلى محطّة اللغز واكتب محاولتك."
          cta="اذهب إلى اللغز"
          onOpen={() => goto(flow.findIndex((f) => f.i === puzzleIdx))}
        />
      ) : (
        <article className="panel" key={`${cur.i}-${cur.k}`}>
          {station.steps ? (
            <>
              <div className="steps">
                {station.steps.map((k, ki) => (
                  <button
                    key={k.id}
                    type="button"
                    className={`step-b${ki === cur.k ? ' on' : ''}`}
                    onClick={() => goto(flow.findIndex((f) => f.i === cur.i && f.k === ki))}
                  >
                    <span className="n">{ki + 1}</span>
                    {k.title.replace(/^[٠-٩0-9]+\)\s*/, '')}
                  </button>
                ))}
              </div>
              <h2 className="step-head">
                <span className="n">{station.label}</span>
                {step.title.replace(/^[٠-٩0-9]+\)\s*/, '')}
              </h2>
              <Blocks blocks={step.blocks} />
              {lab && (
                <div id={`lab-${lab.id}`}>
                  <lab.Component />
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="step-head">{station.title}</h2>
              <Blocks blocks={station.blocks} />
              {station.role === 'puzzle' && !tried && (
                <Gate
                  onTry={() => {
                    setSt(markTried(slug));
                    goto(pos + 1);
                  }}
                  onSkip={() => {
                    setSt(markTried(slug));
                    goto(pos + 1);
                  }}
                />
              )}
              {station.doors && <Doors doors={station.doors} next={nextRegion} />}
            </>
          )}
        </article>
      )}

      <nav className="pager">
        {atStart ? (
          prevRegion ? (
            <Link className="prev" to={prevRegion.path}>
              <span className="k">الإقليم السابق</span>
              <span className="t">→ {prevRegion.id} {prevRegion.title}</span>
            </Link>
          ) : (
            <Link className="prev" to="/">
              <span className="k">الخريطة</span>
              <span className="t">→ الآلة</span>
            </Link>
          )
        ) : (
          <button type="button" className="prev" onClick={() => goto(pos - 1)}>
            <span className="k">السابق · ←</span>
            <span className="t">→ {label(doc, flow[pos - 1])}</span>
          </button>
        )}

        {atEnd ? (
          nextRegion ? (
            <Link className="next" to={nextRegion.path}>
              <span className="k">الإقليم التالي</span>
              <span className="t">{nextRegion.id} {nextRegion.title} ←</span>
            </Link>
          ) : (
            <Link className="next" to="/threads">
              <span className="k">وبعد؟</span>
              <span className="t">الأنماط الثمانية ←</span>
            </Link>
          )
        ) : (
          <button type="button" className="next" onClick={() => goto(pos + 1)} disabled={stationLocked}>
            <span className="k">التالي · →</span>
            <span className="t">{label(doc, flow[pos + 1])} ←</span>
          </button>
        )}
      </nav>
    </div>
  );
}

function label(doc, f) {
  if (!f) return '';
  const s = doc.stations[f.i];
  if (f.k >= 0) return s.steps[f.k].title.replace(/^[٠-٩0-9]+\)\s*/, '').slice(0, 40);
  return s.label;
}
