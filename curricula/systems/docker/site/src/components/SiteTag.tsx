/**
 * موضع التنفيذ: `lab` حيث تُنادى النواة مباشرةً، و`host` حيث يعمل `docker` عند
 * القارئ. محورٌ مستقلٌّ عن السلطة — فلا يأخذ لوناً دلالياً، بل أيقونةً ونصّاً.
 */
import { FlaskConical, Terminal } from 'lucide-react';
import type { RunSite } from '../lib/types';

export function SiteTag({ site }: { site: RunSite }) {
  const Icon = site === 'lab' ? FlaskConical : Terminal;
  return (
    <span className="sitetag" title={site === 'lab' ? 'داخل المختبر — النواة مباشرةً' : 'حيث يعمل docker عندك'}>
      <Icon aria-hidden />
      <span className="en">{site}</span>
    </span>
  );
}
