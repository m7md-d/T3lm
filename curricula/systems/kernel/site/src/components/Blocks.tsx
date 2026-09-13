import { useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { OutputPanel } from './OutputPanel';
import { Trace } from './Trace';
import { Limit, Prose } from './Prose';
import { inline } from '../lib/md';
import type { Block, Panel } from '../lib/types';

/**
 * زوج «تعمل / كُسِرت عمداً».
 *
 * ستُّ مراحلِ كسرٍ في `programs/stages.conf` — `01x` `02x` `05x` `08x` `13x`
 * `16x` — ولكلٍّ أصلٌ يحمل رقمها بلا `x`. والدرس في **المقارنة**: نفس النواة،
 * وسطرٌ واحد اختلف. فيُقلَب بينهما بيد القارئ بدل أن يستعيد الأولى من ذاكرته.
 */
function BreakPair({ broken, working, chapter }: { broken: Panel; working: Panel; chapter: string }) {
  const [showBroken, setShowBroken] = useState(true);
  return (
    <div>
      <div className="pair">
        <button
          type="button" className="pair-b" aria-pressed={!showBroken}
          onClick={() => setShowBroken(false)}
        >
          النواة كما هي · stage {working.stage}
        </button>
        <button
          type="button" className="pair-b" data-broken="1" aria-pressed={showBroken}
          onClick={() => setShowBroken(true)}
        >
          وقد كُسِرت · stage {broken.stage}
        </button>
      </div>
      <Blocks blocks={[showBroken ? broken : working]} chapter={chapter} />
    </div>
  );
}

export function Blocks({ blocks, chapter, pairWith }: {
  blocks: Block[];
  chapter: string;
  /** اللوحة العاملة التي تقابل مرحلة الكسر، إن وُجدت في هذا الفصل */
  pairWith?: (p: Panel) => Panel | null;
}) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === 'prose') return <Prose key={i} html={b.html} />;
        if (b.kind === 'limit') return <Limit key={i} html={b.html} />;
        if (b.kind === 'head')
          return <h3 key={i} id={b.id} className="sub-h" dangerouslySetInnerHTML={{ __html: inline(b.titleMd) }} />;
        if (b.kind === 'code')
          return <CodeBlock key={i} lang={b.lang} code={b.code} file={b.file} chapter={chapter} />;
        if (b.kind === 'trace') return <Trace key={i} t={b} />;
        const mate = pairWith?.(b) ?? null;
        if (mate) return <BreakPair key={i} broken={b} working={mate} chapter={chapter} />;
        return <OutputPanel key={i} p={b} />;
      })}
    </>
  );
}
