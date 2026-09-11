/**
 * البرنامج كاملاً — يُفتَح بطلب القارئ وحده.
 *
 * والفجوة التي يغلقها فجوةٌ في التصديق: `verify.py` يقول «ما طال عن اللقطة
 * يسكن `programs/`، والماركداون يعرض مقتطعه». فالمقتطع لا يُري الرايات ولا
 * التصريحات التي تجعل اللوحة قابلةً للفحص.
 */
import { useEffect, useState } from 'react';
import { filesOf, langOf, load } from '../content/programs';
import { CodeBlock } from './CodeBlock';

export function FullProgram({ name }: { name: string }) {
  const files = filesOf(name);
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [text, setText] = useState<string | null>(null);

  const rel = files[at];

  useEffect(() => {
    if (!open || !rel) return;
    let live = true;
    setText(null);
    load(rel).then((t) => { if (live) setText(t); });
    return () => { live = false; };
  }, [open, rel]);

  if (!files.length) return null;

  return (
    <div className="full">
      <button className="full-go" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'أغلق البرنامج' : 'البرنامج كاملاً'}
      </button>
      {open ? (
        <div className="full-body">
          {files.length > 1 ? (
            <div className="full-tabs">
              {files.map((f, i) => (
                <button
                  key={f}
                  className={`full-tab en${i === at ? ' is-on' : ''}`}
                  onClick={() => setAt(i)}
                >
                  {f.slice(name.length + 1)}
                </button>
              ))}
            </div>
          ) : null}
          {text === null ? <p className="full-wait">يُحمَّل…</p> : <CodeBlock code={text} lang={rel ? langOf(rel) : 'text'} />}
        </div>
      ) : null}
    </div>
  );
}
