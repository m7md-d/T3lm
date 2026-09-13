import { useState } from 'react';
import { inline } from '../lib/md';
import { store } from '../lib/store';
import type { ArtifactRow, Trap } from '../lib/types';

/**
 * الفخاخ التصوّرية — جدولان متقابلان في المصدر: «الفخّ» و«الصواب».
 * وهو قسمٌ تقريريّ يصحّح، ولا يخاصم (الأسلوب §١١).
 */
export function Traps({ traps }: { traps: Trap[] }) {
  return (
    <div className="traps">
      {traps.map((t, i) => (
        <div className="trap" key={i}>
          <div className="trap-q prose" dangerouslySetInnerHTML={{ __html: inline(t.trap) }} />
          <div className="trap-a prose" dangerouslySetInnerHTML={{ __html: inline(t.right) }} />
        </div>
      ))}
    </div>
  );
}

/**
 * `Artifact` — خمسةُ صفوفٍ ثابتة، وهي **تعريف «مكتمل»** في الأسلوب §١٠:
 * «لا تُعدّ الوحدة مكتملةً حتى تنتج خمسة artifacts». فهي ما يتراكم في الأثر،
 * بدل نقاطٍ لا يقابلها شيء.
 */
export function Artifact({ rows }: { rows: ArtifactRow[] }) {
  return (
    <div className="art">
      {rows.map((r, i) => (
        <div className="art-row" key={i}>
          <span className="art-k">{r.label}</span>
          <span className="prose" dangerouslySetInnerHTML={{ __html: inline(r.body) }} />
        </div>
      ))}
    </div>
  );
}

/**
 * `Checkpoint` — «أسئلةٌ تُجاب قبل المتابعة» (الأسلوب §١٣).
 *
 * ولا جواب في المنهج، فلا زرّ كشفٍ في الموقع: ما يُكتَب يبقى للقارئ وحده،
 * ويظهر له لاحقاً في أثره.
 */
export function Checkpoint({ chapter, qs }: { chapter: string; qs: string[] }) {
  return (
    <div className="cp">
      {qs.map((q, i) => <Q key={i} id={`cp:${chapter}:${i}`} n={i + 1} q={q} />)}
    </div>
  );
}

function Q({ id, n, q }: { id: string; n: number; q: string }) {
  const [v, setV] = useState(() => store.prediction(id) ?? '');
  const [saved, setSaved] = useState(false);
  return (
    <div className="cp-q">
      <span className="cp-n">{String(n).padStart(2, '0')}</span>
      <div className="cp-t prose" dangerouslySetInnerHTML={{ __html: inline(q) }} />
      <textarea
        className="write" rows={2} value={v}
        onChange={(e) => { setV(e.target.value); setSaved(false); }}
        onBlur={() => { if (v.trim()) { store.setPrediction(id, v.trim()); setSaved(true); } }}
      />
      {saved && <div className="cp-saved">محفوظ في متصفّحك</div>}
    </div>
  );
}
