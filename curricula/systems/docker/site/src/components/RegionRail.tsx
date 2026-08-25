/**
 * أقاليم الحزمة. **والكشف تدريجيّ** (الأسلوب §٨): ما لم يُبلَغ يُعرَض باسمه
 * وحده، فتُعرَف بقيّة الطريق بلا أن تُحرَق.
 */
import { Link } from 'react-router-dom';
import { store } from '../lib/store';
import { inline } from '../lib/md';

export interface RailItem { no: string; slug: string; title: string; gist?: string }

export function RegionRail({ items }: { items: RailItem[] }) {
  return (
    <nav className="rail">
      {items.map((it) => (
        <Link className="railrow" to={`/r/${it.no}`} key={it.no} data-seen={store.seenIn(it.no) > 0}>
          <span className="railrow__no">{it.no}</span>
          <span className="railrow__title" dangerouslySetInnerHTML={{ __html: inline(it.title) }} />
          {it.gist ? <span className="railrow__gist">{it.gist}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
