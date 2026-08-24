import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MachineMap from '../components/MachineMap.jsx';
import { regions, docs, LOADS } from '../content/index.js';
import { buildRegion } from '../lib/stations.js';
import { load as loadStore, regionProgress } from '../lib/store.js';
import { LABS } from '../widgets/index.js';

const GROUPS = [
  { id: 'trunk', label: 'الجذع — لا مشروع يقوم بدونه', has: ['trunk', 'core'] },
  { id: 'branch', label: 'الفروع — كلٌّ يجهد الجذع في اتجاه', has: ['branch', 'merge'] },
  { id: 'join', label: 'الالتحام', has: ['join'] },
];

export default function Home() {
  const [pick, setPick] = useState(null);
  const [hover, setHover] = useState(null);
  const [st, setSt] = useState({ tried: {}, seen: {}, spoil: false });

  useEffect(() => setSt(loadStore()), []);

  return (
    <div className="wrap">
      <section className="cover">
        <div className="eyebrow">C · الطرفيّة · لينكس</div>
        <h1>مَن يَنتظر؟</h1>
        <p className="sub">
          أربعة برامج تبدو مختلفة — محادثة، لعبة، بثّ، ونقل ملفّات — وهي في الحقيقة{' '}
          <b>آلةٌ واحدة</b> تحت أربعة أحمال. الفرق الوحيد بينها: مَن يُسمح له أن ينتظر، ومَن
          يدفع الثمن حين لا يكفي الوقت للجميع.
        </p>
      </section>

      <MachineMap load={pick} onHover={setHover} />

      <div className="sec-h">
        <b>الأحمال الأربعة</b>
        <span>اختر حِملاً لترى ما يخصّه من الآلة</span>
      </div>
      <div className="loads">
        {LOADS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`load${pick === l.id ? ' on' : ''}`}
            style={{ '--c': l.color }}
            onClick={() => setPick(pick === l.id ? null : l.id)}
          >
            <b>{l.name}</b>
            <span>{l.deadline}</span>
            <div className="pol">
              امتلأ الطابور ⇒ <b style={{ color: l.color }}>{l.policy}</b>
            </div>
          </button>
        ))}
      </div>

      <div className="sec-h">
        <b>الأقاليم</b>
        <span>عشرة · تُقرأ بالترتيب</span>
      </div>

      {GROUPS.map((g) => {
        const list = regions.filter((r) => g.has.includes(r.group));
        if (!list.length) return null;
        return (
          <div key={g.id}>
            <div className="group-tag">{g.label}</div>
            <div className="track">
              {list.map((r) => {
                const doc = buildRegion(r.raw);
                const p = regionProgress(st, r.slug, doc.stations.length);
                const faded = (pick && !r.serves.includes(pick)) || (hover && hover !== r.slug && false);
                return (
                  <div key={r.slug}>
                    <Link to={r.path} className={`node${faded ? ' faded' : ''}`} style={{ '--c': r.color }}>
                      <span className="id">{r.id}</span>
                      <span>
                        <span className="ttl">{r.title}</span>
                        <br />
                        <span className="bl">{r.blurb}</span>
                      </span>
                      <span className="ax">{r.axis}</span>
                      {p > 0 && (
                        <span className="prog budget" style={{ '--accent': r.color }}>
                          <i style={{ width: `${p * 100}%` }} />
                        </span>
                      )}
                    </Link>
                    {r.from && (
                      <div className="merge-hint">
                        ↳ حاصل ضرب <b>٠٤ الإيقاع</b> × <i>٠٥ العقد</i> — ولا يشبه أيّاً منهما.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="sec-h">
        <b>عرضيّاً</b>
        <span>ما يعبر الأقاليم بدل أن يسكن فيها</span>
      </div>
      <div className="cards">
        <Link className="card" to="/threads">
          <b>الأنماط الثمانية</b>
          <span>خيوطٌ يظهر كلٌّ منها في إقليمين على الأقلّ — التكرار ليس صدفة.</span>
        </Link>
        <Link className="card" to="/matrix">
          <b>الجدول الجامع</b>
          <span>سؤالٌ واحد، أربع إجاباتٍ صحيحة. اقرأه عمودياً.</span>
        </Link>
        <Link className="card" to="/labs">
          <b>{LABS.length} مختبرات</b>
          <span>كلٌّ منها ادّعاءٌ من المنهج + مُدخَلٌ تقلبه بيدك.</span>
        </Link>
        {docs.map((d) => (
          <Link className="card" key={d.slug} to={d.path}>
            <b>
              {d.title}
              {d.spoiler && <span style={{ color: 'var(--fg-3)' }}> · محجوب</span>}
            </b>
            <span>{d.blurb}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
