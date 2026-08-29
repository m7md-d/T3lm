/**
 * مختبرُ القاعدة — يقلب: «الشكلُ يقرّر ما بداخله».
 *
 * والمسارُ هنا **نفسُ ملفّ الشكل** الذي يقرؤه C وتقرؤه Skia، ورسمُه بمصيّر
 * متصفّحك عبر `fill-rule` — وهو الاسمُ نفسُه في SVG وPostScript وCanvas.
 * فما تراه ليس محاكاةً للقاعدة؛ هو القاعدة نفسُها في مصيّرٍ ثالث.
 */
import { useState } from 'react';
import { shapes, winding } from '../../content/facts';

const PICKS = [
  { key: 'star', label: 'نجمةٌ تقطع نفسها' },
  { key: 'ring', label: 'حلقةٌ عكسيّةُ الاتّجاه' },
  { key: 'ring-same', label: 'حلقةٌ موافقةُ الاتّجاه' },
];

export function FillRuleLab() {
  const [shape, setShape] = useState('star');
  const [eo, setEo] = useState(false);
  const row = winding.find((w) => w.shape === shape);
  const d = shapes[shape] ?? '';

  return (
    <section className="lab" aria-label="مختبر قاعدة الملء">
      <header className="lab__head">
        <span className="tag">مختبر</span>
        <span>الادّعاء: الشكلُ يقرّر ما بداخله</span>
      </header>

      <div className="lab__controls">
        <div className="ctl">
          <span className="ctl__label">الشكل</span>
          <div className="seg">
            {PICKS.map((p) => (
              <button key={p.key} type="button" className={`seg__b${shape === p.key ? ' is-on' : ''}`}
                      onClick={() => setShape(p.key)}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="ctl">
          <span className="ctl__label">القاعدة</span>
          <div className="seg">
            <button type="button" className={`seg__b${!eo ? ' is-on' : ''}`} onClick={() => setEo(false)}>
              <span className="en">nonzero</span>
            </button>
            <button type="button" className={`seg__b${eo ? ' is-on' : ''}`} onClick={() => setEo(true)}>
              <span className="en">even-odd</span>
            </button>
          </div>
        </div>
      </div>

      <div className="rule__stage">
        <svg viewBox="0 0 256 256" role="img" aria-label="الشكل مملوءاً بالقاعدة المختارة">
          <path d={d} fillRule={eo ? 'evenodd' : 'nonzero'} />
        </svg>
      </div>

      {row && (
        <p className="lab__read">
          عند المركز: عبورات <b className="en">{row.cross}</b> ولفٌّ{' '}
          <b className="en">{row.wind > 0 ? `+${row.wind}` : row.wind}</b>. والبكسلات المملوءة —
          مقيسةً في اللوحة — <b className="en">{eo ? row.eo : row.nz}</b>
{row.nz === row.eo ? '، والقاعدتان تتّفقان هنا.' : '، والقاعدتان تختلفان هنا.'}
        </p>
      )}
    </section>
  );
}
