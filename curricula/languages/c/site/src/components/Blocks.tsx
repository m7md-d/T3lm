import { lazy, Suspense } from 'react';
import { Play, Copy, Check, RotateCcw } from 'lucide-react';
import Terminal from '@t3lm/kit/terminal';
import { inline } from '../lib/inline';
import { AUTH } from '../lib/structure';
import type { Block } from '../lib/structure';
import Gate from './Gate';
import { clangRuntime } from '../lib/clang';

/* المحرّر يُحمَّل كسولاً — لقطةٌ بلا كود لا تدفع ثمنه */
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
 * لوحةٌ من عالم البايتات: مخرَجٌ مسجَّل، أو تحذيرُ مترجم، أو رفضُه.
 *
 * وحدُّها الملوّن يحمل **سلطتها** — من يضمن هذا المخرَج — ومعه وسمُها النصّيّ:
 * قناةٌ ثانية واحدة ولا ثالثة (الأدلّة §٨، فرطُ الترميز d = −0.32).
 */
function Panel({ b }: { b: Extract<Block, { type: 'out' }> }) {
  const a = AUTH[b.auth];
  const said = b.kind === 'err' ? 'رفض المترجم'
    : b.kind === 'warn' ? 'تحذير المترجم' : 'مخرَج مسجَّل';
  return (
    <figure className="rec" data-family={a.family}>
      <figcaption className="rec-head">
        <span className="rec-tag">{said}</span>
        <span className="rec-auth" title={a.says}>{a.word}</span>
      </figcaption>
      <pre className="rec-body en">{b.text}</pre>
      {b.note && <figcaption className="rec-foot">مقتطع — {inline(b.note)}</figcaption>}
    </figure>
  );
}

export default function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="blocks">
      {blocks.map((b, i) => {
        const key = 'id' in b ? b.id : `md-${i}`;
        switch (b.type) {
          case 'md':
            return <div key={key} className="prose" dangerouslySetInnerHTML={{ __html: b.html }} />;

          case 'out':
            return <Panel key={key} b={b} />;

          case 'gate':
            return <Gate key={key} id={b.id} output={b.output} note={b.note} auth={b.auth} />;

          case 'code':
            return (
              <div key={key} className="code-wrap">
                {(b.flags || b.partial) && (
                  <p className="code-note">
                    {b.flags && <span className="code-flags en">cc {b.flags}</span>}
                    {b.partial && b.partial !== '—' && (
                      <span>مقتطع · الكامل في <code className="en">programs/{b.partial}</code></span>
                    )}
                    {b.partial === '—' && <span>مقتطع</span>}
                  </p>
                )}
                <Suspense fallback={<pre className="fig en">{b.code}</pre>}>
                  <Runner
                    initial={b.code}
                    lang="c"
                    /* الزرّ حيث تعده المواصفة وحدها — انظر `markRunnable` */
                    mode={b.runnable ? 'run' : 'view'}
                    persistKey={b.runnable ? b.id : undefined}
                    runtime={b.runnable ? clangRuntime : undefined}
                    labels={ICONS}
                    filename="main.c"
                    useTabs
                    tabSize={4}
                    /* البلوك بقدر نصّه: `#define` سطرٌ واحد، فلا يُحجَز تحته فراغ */
                    minHeight="0"
                    terminal={{ promptDelay: 140 }}
                  />
                </Suspense>
              </div>
            );

          /* أمرٌ محلّيّ: طرفيةُ العدّة — محثٌّ فمخرَجٌ فمحثّ. والوسم يقول إنه
             لا يعمل هنا، فلا تكذب الهيئة على القارئ. */
          case 'local':
            return (
              <div key={key} className="local">
                <span className="local-tag">يُشغَّل عندك — لا في المتصفّح</span>
                <Terminal command={b.code} promptDelay={140} />
              </div>
            );

          case 'figure':
            return <pre key={key} className="fig en">{b.text}</pre>;
        }
      })}
    </div>
  );
}
