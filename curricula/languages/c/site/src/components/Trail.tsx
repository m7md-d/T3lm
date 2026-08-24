import { Check } from 'lucide-react';
import type { Part } from '@t3lm/kit/md';
import type { Shot } from '../lib/structure';
import { inline } from '../lib/inline';
import { store } from '../lib/store';

/**
 * الأثر — ما مضى يُسمّى ويُعَدّ، وما بقي لا يُعرَض.
 *
 * التقدّم مقلوب (`profiles/default.md` §١١): لا عدَّ تنازليّ ولا نسبة، فالكلفة
 * كاملةً قبل البدء تُستثقَل. والأجزاء تظهر بعد بلوغها للسبب نفسه — والفصل صفر
 * وحده ذو أجزاء، أربعةٍ لا يقرأ بينها القارئ نفس النوع من النصّ.
 */
export default function Trail({
  region, shots, parts, at, onGo,
}: {
  region: string;
  shots: Shot[];
  parts: Part[];
  at: number;
  onGo: (i: number) => void;
}) {
  const done = store.seenIn(region);
  /* ما عُبر يبقى مفتوحاً — والعودة إلى نقطةٍ معلومة نقرةٌ واحدة */
  const far = Math.max(at, store.furthest(region));

  return (
    <nav className="trail" aria-label="ما مضى">
      <h4>أثرك في هذا الفصل</h4>
      <ol>
        {shots.map((s, i) => {
          if (i > far) return null;
          const here = i === at;
          const part = parts.find((p) => p.start === i);
          return (
            <li key={s.id} data-on={here || undefined}>
              {part && <b className="trail-part">{inline(part.title)}</b>}
              <button type="button" onClick={() => onGo(i)}>
                <i aria-hidden="true">{here ? '›' : <Check size={12} />}</i>
                <span>{inline(s.title)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {done > 1 && <p className="trail-sum"><b className="num en">{done}</b> لقطة عبرتَها</p>}
    </nav>
  );
}
