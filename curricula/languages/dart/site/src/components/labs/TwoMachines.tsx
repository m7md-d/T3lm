/**
 * مختبر «آلتان، جوابان» — يُحقَن بعد لقطة «وعلى الويب ليست كذلك» (٠٢).
 *
 * **الادّعاء الذي يقلبه:** «إن كان برنامجك سيعمل على الويب، فأعدادك الصحيحة
 * آمنةٌ حتى 2^53 لا 2^63». اللوحة تُثبته بثلاثة أسطر؛ وهذا يجعل الحدّ شيئاً
 * يُقلَب بيد القارئ: يغيّر العدد ويرى أين ينكسر بالضبط.
 *
 * **وهذه حاسبةُ نموذجَي عدد، لا مشغّل Dart** — ولا تدّعي غير ذلك:
 *   الآلة الأصلية: `BigInt` ملفوفةٌ إلى ٦٤ بتاً بالمتمّم الثنائيّ.
 *   الويب:        `Number` — وهو IEEE-754 binary64 نفسه الذي يستعمله dart2js،
 *                 لأن `int` هناك **ليس** نوعاً آخر بل هو هذا العدد بعينه.
 * فالعمود الأيمن ليس محاكاةً: متصفّحك يحسبه بالحساب نفسه الذي يحسب به الويب.
 *
 * والحالة المفاجئة محفوظةٌ زرّاً: `9007199254740992` — حيث تصير `n + 1 == n`.
 */
import { useState } from 'react';

type Op = 'inc' | 'mod' | 'idiv' | 'mul';
const OPS: [Op, string][] = [
  ['inc',  'n + 1 == n'],
  ['mod',  'n % 10'],
  ['idiv', 'n ~/ 3'],
  ['mul',  'n * 3'],
];

const M64 = 1n << 64n;
const wrap = (v: bigint): bigint => {
  const m = ((v % M64) + M64) % M64;
  return m >= 1n << 63n ? m - M64 : m;
};

function onVm(n: bigint, op: Op): string {
  switch (op) {
    case 'inc':  return String(wrap(n + 1n) === wrap(n));
    case 'mod':  return String(((wrap(n) % 10n) + 10n) % 10n);
    case 'idiv': return String(wrap(wrap(n) / 3n));
    case 'mul':  return String(wrap(n * 3n));
  }
}

function onWeb(n: bigint, op: Op): string {
  const x = Number(n);
  switch (op) {
    case 'inc':  return String(x + 1 === x);
    case 'mod':  return String(((x % 10) + 10) % 10);
    case 'idiv': return String(Math.trunc(x / 3));
    case 'mul':  return String(x * 3);
  }
}

const SURPRISE = '9007199254740992';

export function TwoMachines() {
  const [text, setText] = useState(SURPRISE);
  const [op, setOp] = useState<Op>('inc');

  let n: bigint | null = null;
  try { n = BigInt(text.trim() || '0'); } catch { n = null; }

  const vm = n === null ? '—' : onVm(n, op);
  const web = n === null ? '—' : onWeb(n, op);
  const same = vm === web;

  return (
    <section className="lab">
      <header className="lab__head">
        <h3>آلتان، جوابان</h3>
        <p className="lab__claim">
          العدد الصحيح على الويب آمنٌ حتى <span className="en num">2^53</span>،
          لا <span className="en num">2^63</span>. غيّر العدد وابحث عن الحدّ.
        </p>
      </header>

      <div className="lab__controls">
        <label className="lab__field">
          <span>n</span>
          <input
            className="en num"
            inputMode="numeric"
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^\d-]/g, ''))}
            aria-label="العدد"
          />
        </label>
        <div className="lab__ops" role="group" aria-label="العملية">
          {OPS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="chip en"
              data-on={id === op}
              onClick={() => setOp(id)}
            >{label}</button>
          ))}
        </div>
        <button type="button" className="chip chip--wide" onClick={() => { setText(SURPRISE); setOp('inc'); }}>
          أعِدني إلى الحدّ
        </button>
      </div>

      <div className="lab__facets" data-same={same}>
        <div className="lab__facet" data-machine="@vm">
          <div className="lab__facet-tag en">@vm</div>
          <div className="lab__value en num">{vm}</div>
          <div className="lab__note en">64-bit two&#39;s complement</div>
        </div>
        <span className="lab__seam" aria-hidden />
        <div className="lab__facet" data-machine="@web">
          <div className="lab__facet-tag en">@web</div>
          <div className="lab__value en num">{web}</div>
          <div className="lab__note en">IEEE-754 binary64</div>
        </div>
      </div>

      <p className="lab__verdict" data-same={same}>
        {same ? 'الجوابان واحد هنا.' : 'الجوابان مختلفان — وهذا سطرٌ يعمل على آلتك ويكذب على الويب.'}
      </p>
      <p className="lab__disclaimer">
        حاسبةُ نموذجَي العدد. العمود الأيسر <code>BigInt</code> ملفوفةٌ إلى ٦٤ بتاً،
        والأيمن حسابُ متصفّحك — وهو حسابُ الويب نفسه. ولا Dart يعمل هنا.
      </p>
    </section>
  );
}
