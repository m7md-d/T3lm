/**
 * مختبرُ الرقيق — يقلب: «الخطُّ عرضُه بكسلٌ فهو صفٌّ واحدٌ أسود».
 *
 * التغطيةُ تُحسَب هنا حيّةً (تقاطعُ مدًى مع صفّ)، **وفحصُ الدخان يقارنها
 * بالحالات الستّ المقيسة في لوحة `15-hairline`** فتفشل إن اختلفت. فالحساب
 * حيٌّ، وصحّتُه مربوطةٌ بالمنهج لا بحسن النيّة.
 */
import { useState } from 'react';
import { hairline } from '../../content/facts';

const ROWS = [7, 8];

/** تغطيةُ الصفّ `r` بشريطٍ مركزُه `y` وعرضُه `w`. */
export function coverage(y: number, w: number, r: number): number {
  const lo = Math.max(y - w / 2, r);
  const hi = Math.min(y + w / 2, r + 1);
  return Math.max(0, hi - lo);
}

const ys = [8.0, 8.5];
const ws = [1, 0.5, 0.25, 0.125];

export function HairlineLab() {
  const [y, setY] = useState(8.0);
  const [w, setW] = useState(1);
  const covs = ROWS.map((r) => coverage(y, w, r));
  const ink = covs.reduce((a, b) => a + b, 0) * 12;
  const measured = hairline.find((h) => h.y === y && Math.abs(h.w - w) < 1e-6);

  return (
    <section className="lab" aria-label="مختبر الخطّ الرقيق">
      <header className="lab__head">
        <span className="tag">مختبر</span>
        <span>الادّعاء: خطٌّ عرضُه بكسل هو صفٌّ واحدٌ أسود</span>
      </header>

      <div className="lab__controls">
        <div className="ctl">
          <span className="ctl__label">مركزُ الخطّ</span>
          <div className="seg">
            {ys.map((v) => (
              <button key={v} type="button" className={`seg__b${y === v ? ' is-on' : ''}`}
                      onClick={() => setY(v)}>
                <span className="en">y = {v.toFixed(1)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="ctl">
          <span className="ctl__label">العرض</span>
          <div className="seg">
            {ws.map((v) => (
              <button key={v} type="button" className={`seg__b${w === v ? ' is-on' : ''}`}
                      onClick={() => setW(v)}>
                <span className="en">{v}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hair">
        {ROWS.map((r, i) => (
          <div className="hair__row" key={r}>
            <span className="hair__no">الصفّ <span className="num">{r}</span></span>
            <div className="hair__cells">
              {Array.from({ length: 12 }, (_, k) => (
                <i key={k} style={{ opacity: covs[i] }} />
              ))}
            </div>
            <span className="hair__v en">{covs[i]!.toFixed(3)}</span>
          </div>
        ))}
      </div>

      <p className="lab__read">
        الحبر <b className="en">{ink.toFixed(2)}</b> — وهو <b>ثابتٌ</b> في الحالات كلِّها.
        {measured && (
          <> والقيمتان مقيستان في اللوحة: <span className="en">{measured.covA.toFixed(3)}</span>{' '}
            و<span className="en">{measured.covB.toFixed(3)}</span>.</>
        )}
      </p>
    </section>
  );
}
