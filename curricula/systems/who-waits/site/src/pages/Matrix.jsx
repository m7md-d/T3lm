import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { regions, LOADS } from '../content/index.js';
import { extractMatrix } from '../lib/nine.js';

/**
 * المصفوفة — الجدول الجامع من الإقليم ٠٩، مقروءاً **عمودياً**.
 * المنهج يقول صراحةً: «اقرأ الصفّ الخامس عمودياً: سؤالٌ واحد، وأربع إجاباتٍ
 * صحيحةٍ كلّها». فالموقع يجعل العمود هو وحدة الاختيار، لا الصفّ.
 */
export default function Matrix() {
  const nine = regions.find((r) => r.slug === 'craft');
  const m = useMemo(() => extractMatrix(nine.raw), [nine]);
  const [col, setCol] = useState(null);

  if (!m) return null;
  const colorOf = (i) => LOADS[i]?.color || 'var(--fg)';
  const loadId = (i) => LOADS[i]?.id;

  return (
    <div className="wrap">
      <section className="cover">
        <div className="eyebrow">عرضيّاً · من الإقليم ٠٩</div>
        <h1 style={{ fontSize: 'clamp(26px,4.2vw,40px)' }}>الجدول الجامع</h1>
        <p className="sub">
          الآلة واحدة. ما يتغيّر هو <b>المهلة</b> و<b>ما لا يُغتفَر</b> — ومنهما تُشتقّ السياسة.
          اضغط عموداً لتقرأ مشروعاً كاملاً، أو اقرأ صفّ «عند امتلاء الطابور» عمودياً لترى
          المنهج كلّه في سطر.
        </p>
      </section>

      <div className="matrix">
        <table>
          <thead>
            <tr>
              <th />
              {m.head.map((h, i) => (
                <th
                  key={h}
                  className="col"
                  style={{ '--c': colorOf(i) }}
                  onClick={() => setCol(col === i ? null : i)}
                >
                  <b>{h}</b>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.body.map((r) => (
              <tr key={r.label}>
                <td className="rowhead">{r.label}</td>
                {r.cells.map((c, i) => (
                  <td
                    key={i}
                    className={col === i ? 'hot' : col != null ? 'fade' : ''}
                    style={{ '--c': colorOf(i) }}
                    dangerouslySetInnerHTML={{ __html: bold(c) }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {col != null && (
        <div className="panel" style={{ marginBlockStart: 22 }}>
          <div className="sec-h">
            <b style={{ color: colorOf(col) }}>{m.head[col]}</b>
            <span>الأقاليم التي تخدمه</span>
          </div>
          <div className="cards">
            {regions
              .filter((r) => r.serves.includes(loadId(col)))
              .map((r) => (
                <Link key={r.slug} className="card" to={r.path} style={{ borderInlineStartColor: r.color, borderInlineStartWidth: 3 }}>
                  <b style={{ color: r.color }}>
                    {r.id} · {r.title}
                  </b>
                  <span>{r.builds}</span>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* الخلايا تحوي `**…**` و`` `…` `` فقط — تحويلٌ مصغّر بلا محرّك ماركداون كامل */
function bold(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`(.+?)`/g, '<code dir="ltr">$1</code>');
}
