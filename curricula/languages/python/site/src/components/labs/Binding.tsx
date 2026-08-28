/**
 * مختبر الرِّباط — الادّعاء: **`=` تربط، والطريقة تعدّل** (الإقليم ٠٢).
 *
 * والمُدخَل الذي تملكه ثلاث عمليات، والحالة المفاجئة الثالثة: `b = [9]` تبدو
 * «تغييراً لـb» فلا تمسّ `a`، بينما `b.append(3)` تبدو ألطف منها وتغيّر الاثنين.
 *
 * **والعناوين مقروءةٌ من لوحة الإقليم لا مخترعة** — والسهم يحمل عنوانه العددّي
 * لأن ٤٨٪ يقرؤون المؤشّر وعاءً يحوي البيانات حين يخلو السهم من عنوان
 * (`evidence/findings.md` §٥).
 */
import { useState } from 'react';
import { bindingSteps } from '../../content/facts';

export function BindingLab() {
  const [at, setAt] = useState(0);
  if (!bindingSteps.length) return null;
  const step = bindingSteps[Math.min(at, bindingSteps.length - 1)]!;
  const shared = step.a.addr === step.b.addr;

  return (
    <section className="lab" aria-label="مختبر الرِّباط">
      <div className="lab__ops">
        {bindingSteps.map((s, i) => (
          <button
            key={s.op}
            type="button"
            className={`btn${i === at ? ' btn--go' : ''}`}
            onClick={() => setAt(i)}
          >
            <span className="en">{s.op}</span>
          </button>
        ))}
      </div>

      <div className="lab__wire" dir="ltr">
        <div className="lab__names">
          {(['a', 'b'] as const).map((name) => (
            <div className="lab__name" key={name}>
              <span className="lab__id">{name}</span>
              <span className="lab__arrow" aria-hidden />
              <span className="lab__addr">{step[name].addr}</span>
            </div>
          ))}
        </div>
        <div className={`lab__objs${shared ? ' lab__objs--one' : ''}`}>
          <div className="lab__obj">
            <div className="lab__addr">{step.a.addr}</div>
            <div className="lab__val">{step.a.value}</div>
          </div>
          {!shared && (
            <div className="lab__obj">
              <div className="lab__addr">{step.b.addr}</div>
              <div className="lab__val">{step.b.value}</div>
            </div>
          )}
        </div>
      </div>

      <p className="lab__read">
        {shared
          ? 'اسمان مربوطان بكائنٍ واحد — والعنوان واحد.'
          : 'اسمان على كائنين — والأوّل لم يُمسّ.'}
      </p>
    </section>
  );
}
