/** تصيير بلوكات اللقطة — كلٌّ بشكله، والمفردات مفردات هذا المنهج. */
import { useState } from 'react';
import type { Block } from '../lib/structure';
import { store } from '../lib/store';
import Tree from './Tree';
import Scoreboard from './Scoreboard';

/** البوّابة: يُكتب التوقّع قبل أن يُكشَف الرقم — ويُحفَظ لأنه مادّة «فرق الإتقان». */
function Gate({ id, text }: { id: string; text: string }) {
  const saved = store.prediction(id);
  const [draft, setDraft] = useState(saved ?? '');
  const [open, setOpen] = useState(Boolean(saved));

  if (open) {
    return (
      <div className="gate open">
        {draft && <p className="mine"><span>توقّعتَ</span> {draft}</p>}
        <pre className="report en"><code>{text}</code></pre>
      </div>
    );
  }
  return (
    <form
      className="gate"
      onSubmit={(e) => { e.preventDefault(); store.setPrediction(id, draft); setOpen(true); }}
    >
      <label htmlFor={id}>اكتب توقّعك، ثم اكشف.</label>
      <textarea
        id={id}
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="رقمٌ أو جملة"
      />
      <button type="submit" disabled={!draft.trim()}>اكشف اللوحة</button>
    </form>
  );
}

export default function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'md':
            return <div key={i} className="prose" dangerouslySetInnerHTML={{ __html: b.html }} />;
          case 'layout':
            return (
              <div key={i}>
                <Tree layout={b.layout} />
                {b.layout.compare && <Scoreboard id={b.layout.id} />}
              </div>
            );
          case 'report':
            return (
              <div key={i} className="panel">
                {b.note && <span className="note">{b.note}</span>}
                <pre className="report en"><code>{b.text}</code></pre>
              </div>
            );
          case 'gate':
            return <Gate key={i} id={b.id} text={b.text} />;
          case 'cmd':
            return <pre key={i} className="cmd en"><code>{b.code}</code></pre>;
          default:
            return <pre key={i} className="figure en"><code>{b.text}</code></pre>;
        }
      })}
    </>
  );
}
