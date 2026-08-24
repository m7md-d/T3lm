import { Check } from 'lucide-react';
import type { Station } from '../lib/structure';
import type { Part } from '@t3lm/kit/md';
import { inline } from '../lib/inline';
import { store } from '../lib/store';

/**
 * الأثر — التقدّم مقلوباً.
 *
 * ما مضى **يُسمّى ويُعَدّ**؛ وما بقي **لا يُعرَض**: لا عدد، ولا نسبة، ولا نقاط
 * ترقّبٍ فارغة. الشريط التنازليّ يعرض الكلفة قبل البدء فيثقل، والأثر يعدّ من حيث
 * بدأ القارئ فيخفّ. نفس البيانات، ونفسيّةٌ معاكسة.
 *
 * والأجزاء تظهر فيه **بعد عبورها فقط**، للسبب نفسه: عنوان جزءٍ لم يُبلَغ بعدُ
 * إعلانٌ عن كلفةٍ قادمة.
 */
export default function Trail({
  region, shots, parts, at, onGo,
}: {
  region: string;
  shots: Station[];
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

      {done > 1 && (
        <p className="trail-sum">
          <b className="num">{done}</b> لقطة عبرتَها
        </p>
      )}
    </nav>
  );
}
