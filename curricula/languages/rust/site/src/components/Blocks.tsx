import { useMemo, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { highlightToHtml } from '@t3lm/kit/highlight/rust';
import type { Block } from '../lib/structure';
import Gate from './Gate';

/**
 * عرض بلوكات اللقطة.
 *
 * **ولا زرّ تشغيل**: Rust تُترجَم، ولا مفسّر لها في المتصفّح يعطي جواب `rustc`.
 * فالمقطع يُنسَخ ويُشغَّل عند القارئ، ومعه **أمرُه** — والصدق هنا أن يقول الموقع
 * ذلك بدل أن يُظهر زرّاً يكذب.
 */
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  /* التلوين ساكنٌ من محلّل Rust نفسه — بلا محرّر، ولا يُعاد عند كل رسم */
  const html = useMemo(() => highlightToHtml(code, 'rust'), [code]);
  return (
    <figure className="code">
      <figcaption className="code-head">
        <span className="code-lang en">rust</span>
        <button
          type="button"
          className="code-copy"
          onClick={() => {
            void navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? <><Check size={13} /> نُسخ</> : <><Copy size={13} /> نسخ</>}
        </button>
      </figcaption>
      <pre className="code-body en" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}

/** رفض المترجم — بلوكٌ قائم بذاته، ورمزه يفتح صفحة `--explain`. */
function ErrBlock({ text, code }: { text: string; code?: string }) {
  return (
    <figure className="rej">
      <figcaption className="rej-head">
        <span className="rej-tag">رفض المترجم</span>
        {code && <code className="rej-code en">{code}</code>}
      </figcaption>
      <pre className="rej-body en">{text}</pre>
      {code && (
        <figcaption className="rej-foot">
          شرحه كاملاً: <code className="en">rustc --explain {code}</code>
        </figcaption>
      )}
    </figure>
  );
}

export default function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'md':
            return <div key={i} className="prose" dangerouslySetInnerHTML={{ __html: b.html }} />;
          case 'code':
            return <CodeBlock key={i} code={b.code} />;
          case 'err':
            return <ErrBlock key={i} text={b.text} code={b.code} />;
          case 'gate':
            return <Gate key={i} id={b.id} output={b.output} note={b.note} />;
          case 'out':
            return (
              <figure key={i} className="rec">
                <figcaption className="rec-head">
                  <span className="rec-tag">مخرَج مسجَّل</span>
                  <span className="rec-src en">rustc 1.98.0</span>
                </figcaption>
                <pre className="rec-body en">{b.text}</pre>
                {b.note && <figcaption className="rec-foot">مقتطع — {b.note}</figcaption>}
              </figure>
            );
          case 'local':
            return (
              <figure key={i} className="local">
                <figcaption className="local-tag">
                  <Terminal size={13} /> يُشغَّل عندك
                </figcaption>
                <pre className="local-body en">{b.code}</pre>
              </figure>
            );
          case 'figure':
            return <pre key={i} className="figure en">{b.text}</pre>;
        }
      })}
    </>
  );
}
