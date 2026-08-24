import { lazy, Suspense, useEffect, useState } from 'react';
import { Play, Copy, Check, RotateCcw } from 'lucide-react';
import { inline } from '../lib/inline';
import type { Block } from '../lib/structure';
import Gate from './Gate';
import KeywordCard from './KeywordCard';
import Terminal from '@t3lm/kit/terminal';
import { TOOLCHAIN } from '../lib/content';

/* المحرّر يُحمَّل كسولاً — مقطع بلا بلوك تشغيل لا يدفع ثمنه */
const Runner = lazy(() => import('@t3lm/kit/editor').then((m) => ({ default: m.Runner })));

/* الأيقونات من طقم حقيقي (lucide) لا مرسومة باليد: رمزٌ مصنوعٌ ليشبه رمزاً
   معروفاً يخرج مكسوراً. وتُمرَّر من المنهج لأن العدّة لا تختار مظهراً. */
const ICONS = {
  run: <><Play size={13} /> تشغيل</>,
  running: <><Play size={13} /> يُنفَّذ…</>,
  copy: <><Copy size={13} /> نسخ</>,
  copied: <><Check size={13} /> نُسخ</>,
  reset: <><RotateCcw size={13} /> استرجاع</>,
};

/**
 * التنفيذ على جهاز المستخدم: مفسّر Go داخل WASM في عامل. بلا خادم وبلا مغادرة.
 *
 * وحدّه مُعلَن: **مفسّر لا مترجم gc.** محقَّق بتشغيل yaegi 0.16.1 على نفس
 * الحالات — `os.Exit` و`log.Fatal` يظهران ذُعراً بدل إنهاء العملية، فتُنفَّذ
 * الدوال المؤجَّلة التي لا تُنفَّذ في Go الحقيقية.
 */
const FIDELITY =
  'هذا مفسّر يعمل في متصفّحك، لا مترجم Go. ما يُنهي العملية — os.Exit وlog.Fatal — ' +
  'يظهر هنا ذُعراً، فتُنفَّذ الدوال المؤجَّلة التي لا تُنفَّذ عند تشغيلك الحقيقي.';

let goRuntime: ReturnType<typeof import('@t3lm/kit/editor').createWasmGoRuntime> | null = null;
function useGoRuntime() {
  const [rt, setRt] = useState(goRuntime);
  useEffect(() => {
    if (goRuntime) return;
    import('@t3lm/kit/editor').then((m) => {
      goRuntime = m.createWasmGoRuntime('./go-worker.js', { fidelity: FIDELITY });
      setRt(goRuntime);
    });
  }, []);
  return rt;
}

export default function Blocks({ blocks }: { blocks: Block[] }) {
  const go = useGoRuntime();
  return (
    <div className="blocks">
      {blocks.map((b, i) => {
        // مفتاح مستقرّ: بدونه تُعاد استعمال المكوّنات عبر الأقاليم فينتقل الحال
        const key = 'id' in b ? b.id : `md-${i}`;
        switch (b.type) {
          case 'gate':
            return <div key={key}><Gate id={b.id} output={b.output} note={b.note} /></div>;

          /* مخرَجٌ مسجَّل بلا بوّابة: لا محثّ ولا شارة — لوحة سجلّ لا طرفية */
          case 'out':
            return (
              <figure key={key} className="rec rec-plain">
                <figcaption className="rec-head">
                  <span className="rec-tag">مخرَج مسجَّل</span>
                  <span className="rec-src en">{TOOLCHAIN}</span>
                </figcaption>
                <pre className="rec-body">{b.text}</pre>
                {/* لوحةٌ ناقصة تقول ذلك بنفسها — لا يُترَك الإفصاح للنثر */}
                {b.note && <figcaption className="rec-foot">مقتطع — {inline(b.note)}</figcaption>}
              </figure>
            );

          case 'code':
            return (
              <div key={key}>
              <Suspense fallback={<pre className="fig">{b.code}</pre>}>
                <Runner
                  initial={b.code} lang={b.lang as 'go'}
                  mode={b.runnable ? 'run' : 'view'}
                  persistKey={b.runnable ? b.id : undefined}
                  runtime={b.runnable ? go ?? undefined : undefined}
                  notice={b.notice}
                  labels={ICONS}
                  terminal={{ promptDelay: 140 }}
                />
              </Suspense>
              </div>
            );

          case 'local':
            return (
              <div key={key} className="local">
                <span className="local-tag">يُشغَّل محلياً — لا يعمل في المتصفّح</span>
                <Terminal command={b.code} promptDelay={140} />
              </div>
            );

          case 'figure':
            return <pre key={key} className="fig">{b.text}</pre>;

          case 'keyword':
            return <div key={key}><KeywordCard name={b.name} rows={b.rows} /></div>;

          case 'pending':
            return (
              <aside key={key} className="pending">
                <span className="pending-tag">سؤال معلّق {b.label}</span>
                <div dangerouslySetInnerHTML={{ __html: b.html }} />
              </aside>
            );

          default:
            return <div key={key} className="prose" dangerouslySetInnerHTML={{ __html: b.html }} />;
        }
      })}
    </div>
  );
}
