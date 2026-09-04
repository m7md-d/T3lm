/**
 * الرصيف الجانبيّ — محتويات **هذا الفصل** وحده، وأقسامُه التي عبرها القارئ.
 *
 * والفصول الأخرى ليست هنا: مكانها المدخل. وما يهمّ القارئ وهو داخل فصلٍ أن يرى
 * أين هو منه، وأن يعود إلى أي قسمٍ مرّ عليه بضغطة.
 *
 * **ولا يغطّي المتن**: عمودٌ ثابتٌ بعرضه، والمتن يُزاح بمقداره. وعلى الشاشات
 * الضيّقة يصير شريطاً في القاع تُفتَح قائمتُه بطلب.
 *
 * وينمو بالتقدّم: يُعرَض حتى `store.furthest` ولا يُعرَض ما لم يُعبَر — فلا تُرى
 * كلفةُ ما أمام القارئ قبل أن يبلغه.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home, List } from 'lucide-react';
import { store } from '../lib/store';
import type { Region } from '../lib/types';

export function Rail({
  region,
  at,
  nextLabel,
  onPrev,
  onNext,
  go,
}: {
  region: Region;
  at: number;
  nextLabel?: string;
  onPrev: () => void;
  onNext?: () => void;
  go: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const far = Math.max(at, store.furthest(region.num));

  /* المستمع يُسجَّل مرّةً ويقرأ أحدث المعالِجَين من مرجع. */
  const jump = useRef({ onPrev, onNext });
  jump.current = { onPrev, onNext };

  /* السهم الأيسر يتقدّم: القراءة من اليمين إلى اليسار، فالتقدّم يساراً. */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); jump.current.onNext?.(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); jump.current.onPrev(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <aside className={`rail${open ? ' rail--open' : ''}`} aria-label="محتويات الفصل">
      <div className="rail__top">
        <Link className="rail__home" to="/" aria-label="المدخل"><Home aria-hidden /></Link>
        <span className="rail__ch">
          <span className="pack__no">{region.num}</span>
          <span dangerouslySetInnerHTML={{ __html: region.shortHtml }} />
        </span>
        <button
          type="button"
          className="rail__more"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <List aria-hidden />
        </button>
      </div>

      <ol className="rail__list">
        {region.shots.slice(0, far + 1).map((s, i) => (
          <li key={s.id}>
            {s.part && s.part !== region.shots[i - 1]?.part && (
              <div className="rail__part">{s.part}</div>
            )}
            <button
              type="button"
              className={`rail__item${i === at ? ' rail__item--now' : ''}`}
              onClick={() => { go(i); setOpen(false); }}
              dangerouslySetInnerHTML={{ __html: s.titleHtml }}
            />
          </li>
        ))}
        {far >= region.shots.length && region.exercise && (
          <li>
            <button
              type="button"
              className={`rail__item${at === region.shots.length ? ' rail__item--now' : ''}`}
              onClick={() => { go(region.shots.length); setOpen(false); }}
            >
              التمرين
            </button>
          </li>
        )}
      </ol>

      <div className="rail__move">
        <button type="button" className="btn rail__prev" onClick={onPrev}>
          <ArrowRight aria-hidden /> السابق
        </button>
        {onNext && (
          <button type="button" className="btn btn--go rail__next" onClick={onNext}>
            التالي <ArrowLeft aria-hidden />
          </button>
        )}
        {nextLabel && <span className="rail__nextlabel">{nextLabel}</span>}
      </div>
    </aside>
  );
}
