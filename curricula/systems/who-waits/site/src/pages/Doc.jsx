import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { docBySlug, regions } from '../content/index.js';
import Markdown from '../components/Markdown.jsx';
import { Blocks, Locked } from '../components/Blocks.jsx';
import { buildDoc, splitBlast } from '../lib/stations.js';
import { allowSpoiler, load as loadStore } from '../lib/store.js';

/**
 * الملحقات — أجزاءٌ تُفتَح واحداً واحداً، لا صفحةٌ بطول ذراع.
 * وواحدٌ منها محجوبٌ عمداً: README المنهج يكتب حرفياً «لا تفتح شجرة المهارات
 * قبل الإقليم ٠٩ — فيها حرقٌ متعمَّد». الموقع ينفّذ التعليمة، ويفتحها تلقائياً
 * حين تصل فعلاً، أو بإذنك الصريح.
 */
export default function Doc() {
  const { name } = useParams();
  const [sp, setSp] = useSearchParams();
  const doc = docBySlug[name];

  const built = useMemo(() => (doc ? buildDoc(doc.raw) : null), [doc]);
  const [st, setSt] = useState({ tried: {}, seen: {}, spoil: false });
  useEffect(() => setSt(loadStore()), [name]);

  const idx = useMemo(() => {
    if (!built) return 0;
    const i = built.parts.findIndex((p) => p.id === sp.get('p'));
    return i < 0 ? 0 : i;
  }, [built, sp]);

  if (!doc || !built) return <Navigate to="/" replace />;

  const nine = regions[9];
  const reached = Object.keys(st.seen?.[nine.slug] || {}).length > 0;
  const blocked = doc.spoiler && !st.spoil && !reached;
  const part = built.parts[idx];

  return (
    <div className="wrap narrow">
      <section className="cover">
        <div className="eyebrow">ملحق</div>
        <h1 style={{ fontSize: 'clamp(26px,4.2vw,40px)' }}>{doc.title}</h1>
        <p className="sub">{doc.blurb}</p>
      </section>

      {blocked ? (
        <Locked
          title="محجوبٌ بأمرٍ من المنهج نفسه"
          note={doc.gate}
          cta="أنا وصلتُ ٠٩ — افتحها"
          onOpen={() => setSt(allowSpoiler())}
        />
      ) : (
        <>
          {built.lead && (
            <div className="lede">
              <Markdown>{built.lead}</Markdown>
            </div>
          )}

          {built.parts.length > 1 && (
            <div className="steps" style={{ marginBlock: '20px 26px' }}>
              {built.parts.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={`step-b${i === idx ? ' on' : ''}`}
                  onClick={() => {
                    setSp({ p: p.id });
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
                  }}
                >
                  <span className="n">{i + 1}</span>
                  {p.title.replace(/^[٠-٩0-9]+[).]\s*/, '')}
                </button>
              ))}
            </div>
          )}

          <article className="panel" key={part.id}>
            <h2 className="step-head">{part.title}</h2>
            <Blocks blocks={splitBlast(part.body)} />
          </article>

          {built.parts.length > 1 && (
            <nav className="pager">
              <button
                type="button"
                className={`prev${idx === 0 ? ' disabled' : ''}`}
                onClick={() => setSp({ p: built.parts[Math.max(0, idx - 1)].id })}
              >
                <span className="k">السابق</span>
                <span className="t">→ {built.parts[Math.max(0, idx - 1)].title.slice(0, 40)}</span>
              </button>
              <button
                type="button"
                className={`next${idx === built.parts.length - 1 ? ' disabled' : ''}`}
                onClick={() => setSp({ p: built.parts[Math.min(built.parts.length - 1, idx + 1)].id })}
              >
                <span className="k">التالي</span>
                <span className="t">
                  {built.parts[Math.min(built.parts.length - 1, idx + 1)].title.slice(0, 40)} ←
                </span>
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
