/**
 * لوحة المقاييس — **بنفس الترتيب في كل فصل**، فالقارئ يقارن بالموضع لا بالقراءة.
 *
 * ومعها الفرق عن الهيكل الذي قبله في المنهج: نصّ الفصل ٠٠ يقول إن كل فصلٍ
 * يُشرَح بفرقه عمّا سبقه، فاللوحة تعرض ذلك الفرق بدل أن يعدّه القارئ بنفسه.
 *
 * ولا نجومَ ولا ترتيب: «ترتيب الهياكل من الأسوأ إلى الأفضل» مرفوضٌ نصّاً في
 * جدول «ما رُفض عمداً».
 */
import { CHANGES, measured, readReport, type Reading } from '../lib/content';
import { latin } from '../lib/layout';
import { inline } from '../lib/inline';

const num = (s: string) => Number(s.split('·')[0]) || 0;

function Delta({ now, was, lowerIsBetter = true }: { now: number; was?: number; lowerIsBetter?: boolean }) {
  if (was === undefined || was === now) return null;
  const up = now > was;
  /* الاتّجاه معلومة، وليس حكماً: السهم يقول «زاد» أو «نقص» ومعه المقدار */
  return (
    <em className={`delta ${up === lowerIsBetter ? 'worse' : 'better'} en`}>
      {up ? '↑' : '↓'}{Math.abs(now - was)}
    </em>
  );
}

export default function Scoreboard({ id, note }: { id: string; note?: string }) {
  const idx = measured.findIndex((m) => m.layout.id === id);
  const here = measured[idx];
  if (!here) return null;
  const r = readReport(here.report);
  if (!r) return null;

  /* السابق في ترتيب المنهج، وتُتخطّى الأمثلة التعليمية */
  const prevM = measured.slice(0, idx).reverse().find((m) => m.layout.compare);
  const p: Reading | null = prevM ? readReport(prevM.report) : null;

  return (
    <section className="score">
      <header>
        <span>مقاييس <b className="en">{id}</b></span>
        {prevM && <span className="vs">مقابل <b className="en">{prevM.layout.id}</b></span>}
      </header>

      <dl className="gauges">
        <div><dt>ملفّات</dt><dd className="en">{r.files}<Delta now={r.files} was={p?.files} /></dd></div>
        <div><dt>حزم</dt><dd className="en">{r.pkgs}<Delta now={r.pkgs} was={p?.pkgs} /></dd></div>
        <div><dt>حوافّ عابرة</dt><dd className={latin(r.crossing)}>{r.crossing}</dd></div>
        <div><dt>أطول سلسلة</dt><dd className="en">{r.chain}<Delta now={r.chain} was={p?.chain} /></dd></div>
        <div className={r.reaches === 'لا' ? 'flip' : ''}>
          <dt>القائد يصل إلى المقود</dt><dd>{r.reaches}</dd>
        </div>
        <div className={r.violations > 0 ? 'bad' : ''}>
          <dt>مخالفات القاعدة</dt><dd className="en">{r.violations}</dd>
        </div>
        <div><dt>بدائل لاختبار القلب</dt><dd className={latin(r.doubles)}>{r.doubles}</dd></div>
      </dl>

      <table className="changes">
        <thead>
          <tr><th>التغيير</th><th>ما يقيسه</th><th>ملفّات · تخاطر</th></tr>
        </thead>
        <tbody>
          {r.changes.map((c) => {
            const meta = CHANGES.find((x) => x.id === c.id);
            const before = p?.changes.find((x) => x.id === c.id);
            return (
              <tr key={c.id}>
                <th scope="row"><span className="en cid">{c.id}</span> {inline(meta?.label ?? '')}</th>
                <td className="measures">{inline(meta?.measures ?? '')}</td>
                <td className={`val ${latin(c.files) ?? ''}`}>
                  {c.files}
                  {before && <Delta now={num(c.files)} was={num(before.files)} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <footer>{note ?? 'كل رقمٍ هنا مخرَجُ `tools/measure.mjs`، ولا يُكتب بيد.'}</footer>
    </section>
  );
}
