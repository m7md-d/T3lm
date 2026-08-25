/**
 * الأثر داخل الإقليم — **ما خلفك وحده**.
 *
 * الشريط المعتاد يعدّ نحو نهايةٍ لم تُبلَغ فيعرض الكلفة كاملةً قبل البدء. وهذا
 * يعرض ما عُبِر: يكبر كلّما تقدّمت، ويعيدك إلى أيّ لقطةٍ مرّت بضغطة. وما أمامك
 * لا يُعرَض إلا واحداً — يسمّيه زرّ التالي.
 *
 * ولوحٌ قائمٌ بذاته: ارتفاعٌ محجوز، وتمريرٌ خاصّ، وخلفيةٌ معتمة — فلا يمرّ تحت
 * الشريط العلويّ.
 */
import type { Shot } from '../lib/types';
import { inline } from '../lib/md';

export function ShotTrail({
  shots, at, furthest, onGo, part,
}: { shots: Shot[]; at: number; furthest: number; onGo: (i: number) => void; part?: string }) {
  const upto = Math.max(at, furthest);
  const passed = shots.slice(0, upto + 1);

  return (
    <aside className="trail" aria-label="ما عبرتَه في هذا الإقليم">
      {part ? <div className="trail__part" dangerouslySetInnerHTML={{ __html: inline(part) }} /> : null}
      <ol className="trail__list">
        {passed.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className="trail__item"
              data-at={i === at}
              onClick={() => onGo(i)}
            >
              <span className="trail__n num">{String(i + 1).padStart(2, '0')}</span>
              <span className="trail__t" dangerouslySetInnerHTML={{ __html: inline(s.title) }} />
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
