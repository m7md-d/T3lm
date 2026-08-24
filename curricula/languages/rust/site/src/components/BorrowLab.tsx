import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * مقياس الاستعارة — رتّب ثلاثة أسطر، وانظر حكم المترجم.
 *
 * مشتقٌّ من لقطة «ثلاثة أسطر، ترتيبان» في الفصل ٠٠: نفس الأسطر بترتيبين، وحكمان
 * متعاكسان. واللقطة تعرض ترتيبين، وهنا **الستّة كلّها بيد القارئ**.
 *
 * **وكل حكمٍ هنا مسجَّل من `rustc 1.98.0`** — شُغِّلت التباديل الستّة واحداً
 * واحداً، ونُقلت أحكامها. ولا نموذج يخمّن نيابةً عن المترجم.
 *
 * والشريط الرأسيّ يرسم **عمر الاستعارة**: من سطر إنشائها إلى آخر استعمالٍ لها.
 * فإن وقع التعديل داخله رُفض، وإن وقع خارجه قُبل — وهذه قاعدة NLL مرسومة.
 */
const LINES = {
  A: { code: 'let first = &v[0];', role: 'يستعير للقراءة' },
  B: { code: 'v.push(4);', role: 'يعدّل' },
  C: { code: 'println!("{first}");', role: 'يستعمل الاستعارة' },
} as const;

type Key = keyof typeof LINES;

/** أحكام `rustc` للتباديل الستّة، منقولةً من تشغيلها. */
const VERDICTS: Record<string, { ok: boolean; msg: string }> = {
  ABC: { ok: false, msg: 'error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable' },
  ACB: { ok: true, msg: '1' },
  BAC: { ok: true, msg: '1' },
  BCA: { ok: false, msg: 'error[E0425]: cannot find value `first` in this scope' },
  CAB: { ok: false, msg: 'error[E0425]: cannot find value `first` in this scope' },
  CBA: { ok: false, msg: 'error[E0425]: cannot find value `first` in this scope' },
};

export default function BorrowLab() {
  const [order, setOrder] = useState<Key[]>(['A', 'B', 'C']);
  const key = order.join('');
  const v = VERDICTS[key]!;

  const move = (i: number, d: -1 | 1) => {
    const next = [...order];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOrder(next);
  };

  /* عمر الاستعارة: من إنشائها إلى آخر استعمالها. وقبل الإنشاء لا اسم أصلاً. */
  const iA = order.indexOf('A');
  const iC = order.indexOf('C');
  const live = (i: number) => iC > iA && i >= iA && i <= iC;

  return (
    <section className="lab">
      <header className="lab-head">
        <span className="lab-tag">مقياس الاستعارة</span>
        <h2>ثلاثة أسطر، وستّة ترتيبات</h2>
        <p>
          الأسطر الثلاثة نفسها في كل مرّة. حرّكها، واقرأ حكم المترجم — وانظر متى
          يقع التعديل <b>داخل</b> عمر الاستعارة.
        </p>
      </header>

      <div className="lab-body">
        <ol className="lab-lines">
          <li className="lab-fixed">
            <span className="lab-span" aria-hidden="true" />
            <code className="en">let mut v = vec![1, 2, 3];</code>
          </li>
          {order.map((k, i) => (
            <li key={k} data-role={k} data-live={live(i) || undefined}>
              <span className="lab-span" aria-hidden="true" />
              <code className="en">{LINES[k].code}</code>
              <i className="lab-role">{LINES[k].role}</i>
              <span className="lab-move">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="أعلى">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="أسفل">
                  <ChevronDown size={14} />
                </button>
              </span>
            </li>
          ))}
        </ol>

        <div className="lab-verdict" data-ok={v.ok || undefined}>
          <b>{v.ok ? 'قبِل المترجم' : 'رفض المترجم'}</b>
          <pre className="en">{v.msg}</pre>
          <span className="lab-src en">rustc 1.98.0</span>
        </div>
      </div>
    </section>
  );
}
