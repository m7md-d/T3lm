import { lazy, Suspense, useState } from 'react';

import { AUTH } from '../lib/structure';
import type { Proof as P } from '../lib/hero';

/* المحرّر كسولٌ — صفحةٌ بلا كود لا تدفع ثمنه */
const Runner = lazy(() => import('@t3lm/kit/editor').then((m) => ({ default: m.Runner })));

/**
 * برهان الواجهة: نصٌّ واحد، علمان، جوابان.
 *
 * والمفتاح يبدّل **العلم** لا يشغّل شيئاً: المخرَجان مسجَّلان ومفحوصان بـ
 * `tools/verify.py`، والموقع لا يترجم C ولا يدّعي أنه يفعل. وذلك مكتوبٌ تحته
 * قبل أن يلمسه القارئ، لا بعد أن يكتشف.
 */
export function Proof({ proof }: { proof: P }) {
  const [i, setI] = useState(0);
  const run = proof.runs[i]!;
  const a = AUTH[run.auth];

  return (
    <div className="proof">
      <div className="proof-src">
        <Suspense fallback={<pre className="fig en">{proof.source}</pre>}>
          <Runner initial={proof.source} lang="c" mode="view" filename="main.c" useTabs tabSize={4} minHeight="0" />
        </Suspense>
      </div>

      <div className="proof-run">
      <div className="proof-flags" role="group" aria-label="علم الترجمة">
        {proof.runs.map((r, k) => (
          <button key={r.flags} type="button" aria-pressed={k === i} onClick={() => setI(k)}>
            <span className="en">cc {r.flags}</span>
            <span className="proof-when">{r.note}</span>
          </button>
        ))}
      </div>

      <figure className="rec" data-family={a.family}>
        <figcaption className="rec-head">
          <span>المخرَج</span>
          <span className="rec-auth" title={a.says}>{a.word}</span>
        </figcaption>
        <output className="rec-body proof-out en">{run.out}</output>
      </figure>

      </div>

      <p className="proof-say">
        النصّ واحدٌ حرفاً بحرف، والجواب يتغيّر بعلم الترجمة. ومن يقرّر أيَّهما
        تراه ليس النصّ ولا الآلة — <b>هو مترجمك، ورخصةٌ أعطته إيّاها المواصفة.</b>
      </p>
      <p className="proof-fine">
        المخرَجان مسجَّلان من تشغيلٍ حقيقيّ ومفحوصان آلياً. الصفحة لا تترجم C.
      </p>
    </div>
  );
}
