/**
 * لحظة التفاعل الوحيدة في الموقع: **هيكلان جنباً إلى جنب**.
 *
 * وهي منهج الكتاب نفسه مُقلَّباً بيد القارئ — نظامٌ واحد، وتغييراتٌ خمسة ثابتة،
 * والفرق يُقرأ من الأرقام. ولا ترتيبَ ولا تقييم: «ترتيب الهياكل من الأسوأ إلى
 * الأفضل» مرفوضٌ نصّاً في جدول «ما رُفض عمداً».
 */
import { useState } from 'react';
import { CHANGES, measured, readReport } from '../lib/content';
import { latin } from '../lib/layout';
import { inline } from '../lib/inline';

const pool = measured.filter((m) => m.layout.compare);

export default function Compare() {
  const [a, setA] = useState(pool[0]?.layout.id ?? '');
  const [b, setB] = useState(pool[pool.length - 1]?.layout.id ?? '');

  const ra = readReport(pool.find((m) => m.layout.id === a)?.report ?? '');
  const rb = readReport(pool.find((m) => m.layout.id === b)?.report ?? '');

  const Picker = ({ value, onPick, side }: { value: string; onPick: (v: string) => void; side: string }) => (
    <div className="picker" role="group" aria-label={`اختر الهيكل ${side}`}>
      {pool.map((m) => (
        <button
          key={m.layout.id}
          type="button"
          className={`en ${m.layout.id === value ? 'on' : ''}`}
          onClick={() => onPick(m.layout.id)}
        >
          {m.layout.id}
        </button>
      ))}
    </div>
  );

  return (
    <section className="compare">
      <h2>هيكلان، ونظامٌ واحد</h2>
      <p className="sub">
        نفس الطلبات، ونفس الاهتمامات الستّة، ونفس التغييرات الخمسة. اختر اثنين
        واقرأ الفرق.
      </p>

      <div className="pickers">
        <Picker value={a} onPick={setA} side="الأوّل" />
        <Picker value={b} onPick={setB} side="الثاني" />
      </div>

      {ra && rb && (
        <table className="cmp">
          <thead>
            <tr><th /><th className="en">{a}</th><th className="en">{b}</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">ملفّات</th><td className="en">{ra.files}</td><td className="en">{rb.files}</td></tr>
            <tr><th scope="row">حزم</th><td className="en">{ra.pkgs}</td><td className="en">{rb.pkgs}</td></tr>
            <tr><th scope="row">حوافّ عابرة</th><td className={latin(ra.crossing)}>{ra.crossing}</td><td className={latin(rb.crossing)}>{rb.crossing}</td></tr>
            <tr><th scope="row">أطول سلسلة</th><td className="en">{ra.chain}</td><td className="en">{rb.chain}</td></tr>
            <tr className="flipline">
              <th scope="row">القائد يصل إلى المقود</th>
              <td className={ra.reaches === 'لا' ? 'flip' : ''}>{ra.reaches}</td>
              <td className={rb.reaches === 'لا' ? 'flip' : ''}>{rb.reaches}</td>
            </tr>
            <tr><th scope="row">بدائل لاختبار القلب</th><td className={latin(ra.doubles)}>{ra.doubles}</td><td className={latin(rb.doubles)}>{rb.doubles}</td></tr>
            {CHANGES.map((c) => (
              <tr key={c.id} className="chg">
                <th scope="row"><span className="en cid">{c.id}</span> {inline(c.label)}</th>
                <td className={latin(ra.changes.find((x) => x.id === c.id)?.files ?? '')}>
                  {ra.changes.find((x) => x.id === c.id)?.files ?? '—'}
                </td>
                <td className={latin(rb.changes.find((x) => x.id === c.id)?.files ?? '')}>
                  {rb.changes.find((x) => x.id === c.id)?.files ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="foot">
        خانة التغيير <b>ملفّات · اهتماماتٌ مجاورة تُخاطر</b>.
        وكلّها مخرَجُ <code className="en">tools/measure.mjs</code>.
      </p>
    </section>
  );
}
