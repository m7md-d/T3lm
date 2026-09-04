/** الشريط — شفّافٌ يمرّ تحته المتن، وعلامتُه مخرَجُ الـepitome. */
import { Link } from 'react-router-dom';
import { Mark } from './Mark';

export function TopBar({ here }: { here?: string }) {
  return (
    <header className="bar">
      <Link className="bar__mark" to="/" aria-label="المدخل">
        <Mark />
        <span className="bar__name">التمثيل</span>
      </Link>
      <span className="bar__spacer" />
      {here && <span className="label bar__here">{here}</span>}
    </header>
  );
}
