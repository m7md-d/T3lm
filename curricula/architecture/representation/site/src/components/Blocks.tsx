/**
 * كتل القسم — كودٌ وكتلةُ نصٍّ وسؤالُ توقّع.
 *
 * والمفردات مفردات الماركداون نفسه: ما يفرضه `tools/verify.py` هو ما يُعرَض،
 * فلا يفترق ما يراه القارئ عمّا يُتحقَّق منه.
 */
import { useEffect, useState } from 'react';
import { highlightToHtml } from '@t3lm/kit/highlight/python';
import { lexDsl, lexEbnf, lexPanel } from '../lib/lex';
import { TAG } from '../content/compile';
import { store } from '../lib/store';
import type { Block, PanelKind } from '../lib/types';

export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** كتلةُ كودٍ تُقرأ — ملوّنةٌ بمحلّل CodeMirror، لا بتعبيرٍ نمطيّ. */
export function Code({ lang, code, file, from, task, label }: {
  lang: string; code: string; file?: string; from?: string; task?: boolean; label?: string;
}) {
  const src = file ? `programs/${file}.py` : from;
  const cls = ['code', task ? 'code--task' : ''].join(' ').trim();
  return (
    <figure className={cls}>
      {(src || task || label) && (
        <figcaption className="code__head">
          {task && <span className="tag">تكتبه أنت</span>}
          {!task && label && <span className="tag">{label}</span>}
          {src && <span className="code__file">{src}</span>}
        </figcaption>
      )}
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlightToHtml(code, lang || 'python') }} />
      </pre>
    </figure>
  );
}

/**
 * كتلةٌ تُقرأ نصّاً — ولونُ رموزها لونُ من يضمنها (`../lib/lex.ts`).
 * وملفُّ القواعد يُلوَّن بتدوينه، وما عداه بمعجم المخرَجات.
 */
export function Panel({ kind, text, note, arg, label }: {
  kind: PanelKind; text: string; note?: string; arg?: string; label?: string;
}) {
  const body =
    arg?.endsWith('.ebnf') ? lexEbnf(text) :
    arg?.endsWith('.dsl') ? lexDsl(text) :
    lexPanel(text);
  return (
    <figure className={`panel panel--${kind}`}>
      <figcaption className="panel__head">
        <span className="tag">{label ?? TAG[kind]}</span>
        {arg && <span className="code__file">{arg}</span>}
        {note && <span className="panel__note">{note}</span>}
      </figcaption>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: body }} />
      </pre>
    </figure>
  );
}

/**
 * سؤال التوقّع — حيث كتب المؤلّف `المخرَج:` بعد فقرةٍ يطلب فيها التوقّع.
 *
 * والفتح بيد القارئ، ويُبطَّأ عشر ثوانٍ بعد طلبه: يكبح النقر الانعكاسيّ بلا أن
 * يراقبه أحد. وما يُكتَب يُحفَظ ويُعرَض عند نهاية الفصل.
 */
export function Gate({ id, children }: { id: string; children: React.ReactNode }) {
  const saved = store.prediction(id);
  const [text, setText] = useState(saved ?? '');
  const [open, setOpen] = useState(saved !== undefined);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { setOpen(true); return; }
    const t = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  if (open) {
    return (
      <>
        {saved && saved.trim() !== '' && (
          <div className="gate__mine" aria-label="ما توقّعتَه">{saved}</div>
        )}
        {children}
      </>
    );
  }

  return (
    <div className="gate">
      <p className="gate__q">اكتب ما تتوقّعه قبل أن ترى المخرَج.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="توقّعك" rows={3} />
      <div className="row" style={{ marginTop: '0.6rem' }}>
        <button
          type="button"
          className="btn btn--go"
          disabled={!text.trim()}
          onClick={() => { store.setPrediction(id, text.trim()); setOpen(true); }}
        >
          ثبّت توقّعك
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={left !== null}
          onClick={() => setLeft(10)}
        >
          {left === null ? 'افتح بلا توقّع' : <>يُفتَح بعد <span className="num">{left}</span></>}
        </button>
      </div>
    </div>
  );
}

/**
 * يعرض التسلسل، ويقفل السؤالُ **المخرَجَ وما بعده في القسم**: الشرحُ الذي يليه
 * يقول الجواب، فيُقرأ قبل أن يُكشَف ما يفسّره.
 */
export function Blocks({ blocks, idBase, gateNo = 0 }: {
  blocks: Block[]; idBase: string; gateNo?: number;
}) {
  const out: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (b.t === 'gate') {
      out.push(
        <Gate key={`g${i}`} id={`${idBase}:${gateNo}`}>
          <Blocks blocks={blocks.slice(i + 1)} idBase={idBase} gateNo={gateNo + 1} />
        </Gate>
      );
      break;
    }
    if (b.t === 'prose') out.push(<Prose key={i} className="prose-wrap" html={b.html} />);
    else if (b.t === 'code') out.push(<Code key={i} {...b} />);
    else out.push(<Panel key={i} {...b} />);
  }
  return <div className="stack">{out}</div>;
}
