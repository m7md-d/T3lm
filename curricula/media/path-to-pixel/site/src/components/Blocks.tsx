/**
 * بلوكات اللقطة — كودٌ ولوحةٌ وصيغةٌ وبوّابة.
 *
 * والمفردات مفردات الماركداون نفسه: ما يفرضه `tools/verify.py` هو ما يُعرَض،
 * فلا يفترق ما يراه القارئ عمّا يُتحقَّق منه.
 */
import { useEffect, useState } from 'react';
import { highlightToHtml as hlC } from '@t3lm/kit/highlight/c';
import { highlightToHtml as hlSh } from '@t3lm/kit/highlight/sh';
import { lexPanel } from '../lib/panel';
import { store } from '../lib/store';
import type { Authority, Block, PanelKind } from '../lib/types';

export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** بلوكُ كودٍ يُقرأ — ملوّنٌ بمحلّل CodeMirror، لا بتعبيرٍ نمطيّ. */
export function Code({ lang, code, file, head, task }: {
  lang: string; code: string; file?: string; head?: string; task?: boolean;
}) {
  const label = file ? `programs/${file}.c` : head ? `programs/${head}` : null;
  const cls = ['code', !label && !task ? 'code--bare' : '', task ? 'code--task' : ''].join(' ').trim();
  const painted = lang === 'bash' || lang === 'sh' ? hlSh(code, 'sh') : hlC(code, 'c');
  return (
    <figure className={cls}>
      {(label || task) && (
        <figcaption className="code__head">
          {label ? <span className="code__file">{label}</span> : <span className="tag">تكتبه أنت</span>}
        </figcaption>
      )}
      <pre>
        <code dangerouslySetInnerHTML={{ __html: painted }} />
      </pre>
    </figure>
  );
}

/** صيغةٌ رياضية: لا تُلوَّن كوداً لأنها ليست كوداً، ولا تُفحَص لأنها ليست ادّعاء. */
export function Math({ text }: { text: string }) {
  return (
    <figure className="math">
      <pre><code>{text}</code></pre>
    </figure>
  );
}

/** وسمُ اللوحة: قناةٌ ثانيةٌ واحدةٌ مع اللون، لا ثالثة. */
const TAG: Record<PanelKind, string> = {
  out: 'مخرَجٌ حتميّ',
  ref: 'قياسٌ ضدّ Skia',
  runs: 'يختلف بين تشغيلين',
  err: 'رفضٌ من المترجم',
  shell: 'أوامرُ صدفة',
};

const AUTH: Record<Authority, string> = {
  math: 'رياضيات',
  rule: 'قاعدةٌ مختارة',
  precision: 'دقّةُ عدد',
  colorspace: 'فضاءُ لون',
};

export function Panel({ kind, text, note, arg, authority }: {
  kind: PanelKind; text: string; note?: string; arg?: string; authority?: Authority;
}) {
  return (
    <figure className={`panel panel--${kind}${authority ? ` auth--${authority}` : ''}`}>
      <figcaption className="panel__head">
        <span className="tag">{TAG[kind]}</span>
        {arg && <span className="en">{arg}</span>}
        {authority && <span className="tag tag--auth">@{authority} · {AUTH[authority]}</span>}
        {note && <span className="panel__note">{note}</span>}
      </figcaption>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: lexPanel(text) }} />
      </pre>
    </figure>
  );
}

/**
 * البوّابة — حيث كتب المؤلّف `المخرَج:` بعد فقرةٍ يطلب فيها التنبّؤ.
 * والمخرج بيد القارئ، ويُبطَّأ عشر ثوانٍ بعد طلبه: يكبح النقر الانعكاسيّ بلا
 * أن يراقبه أحد. وما يُكتَب يُحفَظ ويُعرَض عند نهاية الإقليم.
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
      <p className="gate__q">اكتب ما تتوقّعه قبل أن ترى اللوحة.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="توقّعك" rows={3} />
      <div className="row" style={{ marginTop: '0.6rem' }}>
        <button type="button" className="btn btn--go" disabled={!text.trim()}
                onClick={() => { store.setPrediction(id, text.trim()); setOpen(true); }}>
          ثبّت توقّعك
        </button>
        <button type="button" className="btn btn--ghost" disabled={left !== null} onClick={() => setLeft(10)}>
          {left === null ? 'افتح بلا توقّع' : <>يُفتَح بعد <span className="num">{left}</span></>}
        </button>
      </div>
    </div>
  );
}

/**
 * يعرض التسلسل، وتقفل البوّابةُ **اللوحةَ وما بعدها في اللقطة** — ومنه
 * المختبر، فهو يعرض الجواب نفسه بشكلٍ آخر.
 *
 * ولا تقفل اللوحة وحدها: الشرحُ الذي يليها يقول الجواب، فيُقرأ قبل أن يُكشَف
 * ما يفسّره — والبوّابة حينها زينة.
 */
export function Blocks({ blocks, idBase, gateNo = 0, tail }: {
  blocks: Block[]; idBase: string; gateNo?: number; tail?: React.ReactNode;
}) {
  const out: React.ReactNode[] = [];
  let gated = false;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (b.t === 'gate') {
      gated = true;
      out.push(
        <Gate key={`g${i}`} id={`${idBase}:${gateNo}`}>
          <Blocks blocks={blocks.slice(i + 1)} idBase={idBase} gateNo={gateNo + 1} tail={tail} />
        </Gate>
      );
      break;
    }
    if (b.t === 'prose') out.push(<Prose key={i} className="prose-wrap" html={b.html} />);
    else if (b.t === 'code') out.push(<Code key={i} {...b} />);
    else if (b.t === 'math') out.push(<Math key={i} {...b} />);
    else out.push(<Panel key={i} {...b} />);
  }
  /* المختبرُ ذيلُ اللقطة، فتشمله البوّابةُ كما تشمل اللوحة — وإلا قرأ القارئ
     الجواب في المختبر قبل أن يكتب توقّعه. وإن قُفلت البوّابة فقد حملته هي،
     فلا يُضاف هنا مرّةً ثانية. */
  if (tail && !gated) out.push(<div key="tail">{tail}</div>);
  return <div className="stack">{out}</div>;
}
