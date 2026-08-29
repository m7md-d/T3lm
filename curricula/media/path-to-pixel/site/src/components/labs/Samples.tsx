/**
 * مختبرُ العيّنات — يقلب: «عيّناتٌ أكثرُ تعني جواباً أصحّ».
 *
 * والأرقام كلُّها من لوحة `08-super`، وشريطُ الرمادِ يعرض القيمة كما هي:
 * فيُرى الشريطُ ذو العُشر **غائباً تماماً** تحت `4×4`، وموجوداً بربعٍ زائد
 * تحت `16×16`، وصحيحاً بالمساحة.
 */
import { useState } from 'react';
import { samples } from '../../content/facts';

const COLS = [
  { key: 's1', label: '1×1' },
  { key: 's4', label: '4×4' },
  { key: 's16', label: '16×16' },
  { key: 'area', label: 'المساحة' },
] as const;

export function SamplesLab() {
  const [h, setH] = useState(samples[0]?.height ?? 0.1);
  const row = samples.find((s) => s.height === h) ?? samples[0];

  return (
    <section className="lab" aria-label="مختبر العيّنات">
      <header className="lab__head">
        <span className="tag">مختبر</span>
        <span>الادّعاء: عيّناتٌ أكثرُ تعني جواباً أصحّ</span>
      </header>

      <div className="lab__controls">
        <div className="ctl">
          <span className="ctl__label">ارتفاعُ الشريط</span>
          <div className="seg">
            {samples.map((s) => (
              <button key={s.height} type="button" className={`seg__b${h === s.height ? ' is-on' : ''}`}
                      onClick={() => setH(s.height)}>
                <span className="en">{s.height.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {row && (
        <>
          <div className="samp">
            {COLS.map((c) => (
              <div className="samp__col" key={c.key}>
                <span className="samp__lab en">{c.label}</span>
                <span className="samp__cell"><i style={{ opacity: row[c.key] }} /></span>
                <span className="samp__v en">{row[c.key].toFixed(4)}</span>
              </div>
            ))}
          </div>
          <p className="lab__read">
            التغطيةُ الصحيحة هي الارتفاع نفسُه: <b className="en">{row.height.toFixed(4)}</b>.
            {row.s4 === 0
              ? ' وتحت 4×4 لا وجودَ للشريط أصلاً.'
              : ' وأيُّ عددٍ من العيّنات يعطي مضاعفاً لخطوته، لا الجواب.'}
          </p>
        </>
      )}
    </section>
  );
}
