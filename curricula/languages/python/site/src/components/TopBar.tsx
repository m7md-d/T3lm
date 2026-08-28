/**
 * الشريط — شفّافٌ يمرّ تحته المتن، وفيه العلامة الرسمية ملفّاً كما هي
 * (`public/python-logo.svg` من python.org). لا تُرسَم ولا تُعاد صياغتها.
 */
import { Link } from 'react-router-dom';

export function TopBar({ here }: { here?: string }) {
  return (
    <header className="bar">
      <Link className="bar__mark" to="/" aria-label="المدخل">
        <img src="./python-logo.svg" alt="Python" />
      </Link>
      <span className="bar__spacer" />
      {here && <span className="label bar__here">{here}</span>}
    </header>
  );
}
