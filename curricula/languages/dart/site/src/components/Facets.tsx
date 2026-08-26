/**
 * وجها الطيّة — تشغيلان متجاوران بآلتين مختلفتين، ولكلٍّ برنامجُه.
 * وهي حال المقارنة بلغة المرساة: `dart` ولوحتُه، ثم `c` ولوحتُه، بلا نثرٍ
 * بينهما — فالمؤلّف وضعهما متجاورين ليُقرآ معاً، والموقع يقرأ ذلك من الترتيب.
 */
import type { FacetsBlock } from '../lib/types';
import { Run } from './Run';

export function Facets({ block }: { block: FacetsBlock }) {
  return (
    <div className="facets facets--runs" data-n={block.runs.length}>
      {block.runs.map((r, i) => (
        <div className="facets__side" key={i}>
          <Run block={r} />
        </div>
      ))}
    </div>
  );
}
