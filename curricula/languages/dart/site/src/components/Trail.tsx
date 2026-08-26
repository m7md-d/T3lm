/**
 * الأثر داخل الإقليم — **ما خلفك وحده**.
 *
 * يكبر كلّما تقدّمت، ويعيدك إلى أيّ لقطةٍ مرّت بضغطة. وما أمامك لا يُعرَض إلا
 * واحداً — يسمّيه زرّ التالي. ولوحٌ قائمٌ بذاته: ارتفاعٌ محجوز، وتمريرٌ خاصّ،
 * وخلفيةٌ معتمة — فلا يمرّ تحت الشريط.
 *
 * والجزء يُسمّى فوق لقطته الأولى فقط: الفصل صفر وحده ذو أجزاء (٣١ لقطةً في
 * أربعة أجزاء)، وترويسةٌ متكرّرة ضوضاء.
 */
import type { Shot } from '../lib/types';
import { inline } from '../lib/md';

export function Trail({
  shots, at, furthest, onGo,
}: { shots: Shot[]; at: number; furthest: number; onGo: (i: number) => void }) {
  const upto = Math.max(at, furthest);
  const passed = shots.slice(0, upto + 1);

  return (
    <aside className="trail" aria-label="ما عبرتَه في هذا الإقليم">
      <ol className="trail__list">
        {passed.map((s, i) => {
          const newPart = s.part && s.part !== passed[i - 1]?.part;
          return (
            <li key={s.id}>
              {newPart ? <div className="trail__part" dangerouslySetInnerHTML={{ __html: inline(s.part!) }} /> : null}
              <button type="button" className="trail__item" data-at={i === at} onClick={() => onGo(i)}>
                <span className="trail__n num en">{String(i + 1).padStart(2, '0')}</span>
                <span className="trail__t" dangerouslySetInnerHTML={{ __html: inline(s.title) }} />
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
