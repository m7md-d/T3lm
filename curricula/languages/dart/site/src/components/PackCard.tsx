/**
 * بطاقة حزمة — خمسٌ، ولكلٍّ **ما تأخذه** نصّاً من جدول `../../../README.md`.
 *
 * ولا حقلَ ثابتاً فيها: «الإقليم» تحت كل بطاقةٍ زخرفةٌ (قيمةٌ واحدةٌ لكل
 * العناصر). وما يفرّق البطاقات هو نصُّ المؤلّف نفسه، وسطرُ كل إقليمٍ في
 * جدول «وتفصيلُها» — فيُنقَل ولا يُخترَع.
 */
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { Pack } from '../lib/types';
import { inline } from '../lib/md';
import { briefs } from '../content/readme';

export interface PackRegion { no: string; name: string }

export function PackCard({
  pack, regions, open, onToggle,
}: { pack: Pack; regions: PackRegion[]; open: boolean; onToggle: () => void }) {
  return (
    <section className="pack" data-open={open}>
      <button type="button" className="pack__head" onClick={onToggle} aria-expanded={open}>
        <span className="pack__range num en">{pack.from}–{pack.to}</span>
        <span className="pack__name">{pack.name}</span>
        <span className="spacer" />
        <ChevronDown className="pack__chev" aria-hidden />
      </button>
      <p className="pack__takes" dangerouslySetInnerHTML={{ __html: inline(pack.takes) }} />
      {open ? (
        <ol className="pack__list">
          {regions.map((r) => (
            <li key={r.no}>
              <Link to={`/r/${r.no}`}>
                <span className="pack__n num en">{r.no}</span>
                <span className="pack__t">
                  <span className="pack__title" dangerouslySetInnerHTML={{ __html: inline(r.name) }} />
                  {briefs[r.no] ? (
                    <span className="pack__brief" dangerouslySetInnerHTML={{ __html: inline(briefs[r.no]!) }} />
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
