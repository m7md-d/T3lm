/**
 * أقسام الفصل. ما عُبر يبقى مفتوحاً — الأثر لا يتراجع.
 * ولا عدد ولا نسبة: العلامة أثرٌ لا حساب.
 */
import { Link } from 'react-router-dom';
import { store } from '../lib/store';
import { Title } from './Title';
import type { Chapter } from '../lib/types';

export function ChapterRail({ ch, at }: { ch: Chapter; at: number }) {
  const far = store.furthest(ch.num);
  return (
    <nav className="rail" aria-label="أقسام الفصل">
      <Link className={`rail-a${at === -1 ? ' is-at' : ''}`} to={`/f/${ch.num}`}>
        <span className="rail-n en">—</span>
        <span className="rail-t">المدخل</span>
      </Link>
      {ch.shots.map((s, i) => (
        <Link
          key={s.id}
          className={`rail-a${i === at ? ' is-at' : ''}${i <= far ? ' is-seen' : ''}`}
          to={`/f/${ch.num}/${i}`}
        >
          <span className="rail-n en">{String(i + 1).padStart(2, '0')}</span>
          <Title md={s.titleMd} className="rail-t" />
        </Link>
      ))}
    </nav>
  );
}
