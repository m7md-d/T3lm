/**
 * برنامجٌ ولوحاتُه.
 *
 * ولوحتان لبرنامجٍ واحد **ليستا تكراراً**: هما جوابان لسؤالٍ واحد من آلتين —
 * الإقليم ٠٢ «وعلى الويب ليست كذلك». فتُعرَضان متقابلتين وبينهما الطيّة، لأن
 * المقارنة هي الدرس والتقارب المكانيّ يوفّرها بلا مطابقةٍ ذهنية (d ≈ 0.80).
 */
import type { RunBlock } from '../lib/types';
import { Code } from './Code';
import { Panel } from './Panel';
import { Gate } from './Gate';

function OnePanel({ p }: { p: RunBlock['panels'][number] }) {
  return p.gate
    ? <Gate id={p.gate.id} askHtml={p.gate.askHtml}><Panel block={p} /></Gate>
    : <Panel block={p} />;
}

export function Run({ block }: { block: RunBlock }) {
  const many = block.panels.length > 1;
  return (
    <div className="run">
      {block.program ? <Code program={block.program} /> : null}
      {many ? (
        <div className="facets" data-n={block.panels.length}>
          {block.panels.map((p, i) => (
            <div className="facets__side" key={i}>
              <OnePanel p={p} />
            </div>
          ))}
        </div>
      ) : (
        block.panels.map((p, i) => <OnePanel key={i} p={p} />)
      )}
    </div>
  );
}
