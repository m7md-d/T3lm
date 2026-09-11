import { CodeBlock } from './CodeBlock';
import { Panel } from './Panel';
import { Prose } from './Prose';
import type { Block } from '../lib/types';

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === 'prose') return <Prose key={i} html={b.html} />;
        if (b.kind === 'code') return <CodeBlock key={i} code={b.code} lang={b.lang} />;
        return <Panel key={b.id} p={b} />;
      })}
    </>
  );
}
