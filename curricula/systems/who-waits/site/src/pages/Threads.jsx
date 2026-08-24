import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { regions, bySlug } from '../content/index.js';
import { extractPatterns } from '../lib/nine.js';
import Markdown from '../components/Markdown.jsx';

/**
 * الخيوط — الأنماط الثمانية مستخرَجةٌ من الإقليم ٠٩ نفسه.
 * الصفحة موجودة لأن روابط المنهج المتقاطعة كثيفة: المحتوى **شبكة** لا سلسلة،
 * وهذه هي الشبكة مرسومة.
 */
export default function Threads() {
  const nine = regions.find((r) => r.slug === 'craft');
  const pats = useMemo(() => extractPatterns(nine.raw), [nine]);
  const [on, setOn] = useState(null);

  const byId = Object.fromEntries(regions.map((r) => [r.id, r]));
  const active = on == null ? null : pats[on];

  return (
    <div className="wrap">
      <section className="cover">
        <div className="eyebrow">عرضيّاً · من الإقليم ٠٩</div>
        <h1 style={{ fontSize: 'clamp(26px,4.2vw,40px)' }}>الأنماط الثمانية</h1>
        <p className="sub">
          ثمانية أنماطٍ يظهر كلٌّ منها في إقليمين على الأقلّ، في سياقاتٍ لا يشبه أحدها الآخر.
          التكرار ليس صدفة: إن رأيتَ نمطاً منها في مشروعٍ جديد، فأنت تعرف ما يلي بعده.
        </p>
      </section>

      <div className="threads">
        {pats.map((p, i) => (
          <button
            key={p.n}
            type="button"
            className={`thread${on === i ? ' on' : ''}`}
            onClick={() => setOn(on === i ? null : i)}
          >
            <span className="n">{p.n}</span>
            <span className="tx">
              <b>{p.title}</b>
              <span>{p.rest.replace(/[*`]/g, '').slice(0, 120)}</span>
            </span>
            <span className="hits">
              {p.ids.map((id) => {
                const r = byId[id];
                return (
                  <span key={id} className="pin" style={{ '--c': r ? r.color : 'var(--fg-3)' }}>
                    {id}
                  </span>
                );
              })}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="panel" style={{ marginBlockStart: 18 }}>
          <div className="sec-h">
            <b>{active.title}</b>
            <span>حيث يظهر</span>
          </div>
          <div className="md">
            <Markdown>{active.rest}</Markdown>
          </div>
          <div className="cards">
            {active.ids.map((id) => {
              const r = byId[id];
              if (!r) return null;
              return (
                <Link key={id} className="card" to={r.path} style={{ borderInlineStartColor: r.color, borderInlineStartWidth: 3 }}>
                  <b style={{ color: r.color }}>
                    {r.id} · {r.title}
                  </b>
                  <span>{r.blurb}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <p className="lede" style={{ marginBlockStart: 30, color: 'var(--fg-3)', fontSize: 14 }}>
        كل ما في هذه الصفحة مستخرَجٌ من قسم «الأنماط التي تكرّرت» في{' '}
        <Link to={bySlug.craft.path}>الإقليم ٠٩</Link> — الماركداون هو المصدر، والموقع يصرّفه.
      </p>
    </div>
  );
}
