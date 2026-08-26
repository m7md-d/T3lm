/**
 * اللقطة — ادّعاءٌ واحد + دليله + مكسبه. حدُّها ≤٢٥٠ كلمة · ≤بلوكان · ≤٣
 * عناصر، ونهايتُها مرئيةٌ من بدايتها.
 */
import type { AnyBlock, Shot as ShotT } from '../lib/types';
import { inline } from '../lib/md';
import { Prose } from './Prose';
import { Figure } from './Figure';
import { Run } from './Run';
import { Facets } from './Facets';
import { LabSlot } from './LabSlot';

export function Block({ block }: { block: AnyBlock }) {
  switch (block.kind) {
    case 'prose':  return <Prose html={block.html} />;
    case 'figure': return <Figure text={block.text} />;
    case 'run':    return <Run block={block} />;
    case 'facets': return <Facets block={block} />;
    case 'gate':   return null;
  }
}

export function Shot({ shot, n, region }: { shot: ShotT; n: number; region: string }) {
  return (
    <article className="shot" id={shot.id}>
      <div className="shot__head">
        <span className="shot__n num en">{String(n).padStart(2, '0')}</span>
        <h2 dangerouslySetInnerHTML={{ __html: inline(shot.title) }} />
      </div>
      <div className="shot__body">
        {shot.blocks.map((b, i) => <Block block={b} key={i} />)}
      </div>
      <LabSlot region={region} title={shot.title} />
    </article>
  );
}
