import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

import { AUTH } from '../lib/structure';
import { inline } from '../lib/inline';
import type { Example } from '../lib/examples';

/* المحرّر كسولٌ — صفحةٌ بلا كود لا تدفع ثمنه */
const Runner = lazy(() => import('@t3lm/kit/editor').then((m) => ({ default: m.Runner })));

/**
 * مثالٌ محلول: برنامجٌ كامل ومخرَجُه، ورابطٌ إلى موضعه في المتن.
 *
 * الأدلّة §٤: التتبّع شرطٌ سابق للكتابة، و**≥ ٨٠٪ قراءةً وتتبّعاً**. وهذا هو
 * البلوك الذي يحمل ذلك النصيب — يُقرأ ولا يُطلَب منه شيء، ولا بوّابةَ عليه:
 * قارئ الواجهة بلا مرساةٍ معرفية بعد، والبوّابة بلا مرساةٍ حاجزٌ إداريّ (§٣).
 */
export function Worked({ ex, big = false }: { ex: Example; big?: boolean }) {
  const a = AUTH[ex.auth];

  return (
    <figure className={big ? 'work work-big' : 'work'}>
      <Suspense fallback={<pre className="fig en">{ex.code}</pre>}>
        <Runner initial={ex.code} lang="c" mode="view" filename="main.c" useTabs tabSize={4} minHeight="0" />
      </Suspense>

      <div className="work-out" data-family={a.family}>
        <span className="work-tag">المخرَج</span>
        <pre className="en"><code>{ex.out}</code></pre>
      </div>

      <figcaption className="work-from">
        <Link to={`/r/${ex.num}?s=${ex.at}`}>
          <span className="work-num en">{ex.num}</span>
          {inline(ex.shot)}
        </Link>
      </figcaption>
    </figure>
  );
}
