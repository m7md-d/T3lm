/**
 * البديهيات الخمس — من جدول `../../../README.md`، ومعها **أوّل ما يتساقط منها**.
 * وهي جوهر المنهج لا زينة الصفحة: كل غرابةٍ لاحقة تُشتقّ من واحدةٍ منها بالاسم.
 *
 * ولا لونَ لأيّها: خمسٌ فوق حدّ الفئات الأربع، ولونٌ لكلٍّ يصير ضوضاء.
 * والتمييز رقمٌ ونصّ.
 */
import type { Axiom } from '../lib/types';
import { inline } from '../lib/md';

export function AxiomList({ items }: { items: Axiom[] }) {
  return (
    <ol className="axioms">
      {items.map((a) => (
        <li className="axiom" key={a.n}>
          <span className="axiom__n">{a.n}</span>
          <div>
            <p className="axiom__claim" dangerouslySetInnerHTML={{ __html: inline(a.claim) }} />
            <p className="axiom__falls" dangerouslySetInnerHTML={{ __html: inline(a.falls) }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
