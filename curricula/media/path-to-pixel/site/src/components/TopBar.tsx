/**
 * الشريط — شفّافٌ يمرّ تحته المتن، وفيه العلامةُ المشتقّة من المحتوى.
 */
import { Link } from 'react-router-dom';
import { Mark } from './Mark';

export function TopBar({ here }: { here?: string }) {
  return (
    <header className="bar">
      <Link className="bar__mark" to="/" aria-label="المدخل">
        <Mark className="mark mark--bar" />
      </Link>
      <span className="bar__spacer" />
      {here && <span className="label bar__here">{here}</span>}
    </header>
  );
}
