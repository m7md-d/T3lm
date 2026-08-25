/**
 * البديهيات الخمس بعمود «أوّل ما يتساقط منها» — جدولها في `../../README.md`.
 * وهي **جوهر المنهج**، فتكون مادّة الصفحة الأولى بدل قائمة فصولٍ فيها.
 */
import type { Axiom } from '../lib/types';
import { inline } from '../lib/md';

export function AxiomList({ items }: { items: Axiom[] }) {
  return (
    <div>
      {items.map((a) => (
        <div className="axiom" key={a.n}>
          <span className="axiom__n num">{a.n}</span>
          <span className="axiom__claim" dangerouslySetInnerHTML={{ __html: inline(a.claim) }} />
          <span className="axiom__falls" dangerouslySetInnerHTML={{ __html: inline(a.falls) }} />
        </div>
      ))}
    </div>
  );
}
