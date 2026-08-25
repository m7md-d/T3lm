/**
 * اللقطة — ادّعاءٌ واحد + دليله + مكسبه. حدُّها ≤٢٥٠ كلمة · ≤بلوكان · ≤٣ عناصر،
 * ونهايتُها مرئيةٌ من بدايتها.
 *
 * والبلوكات تُصرَّف من الماركداون بمفردات هذا المنهج: لوحةٌ مسجَّلة، وبوّابة،
 * ومقتطف برنامج. ولوحات `lab` المتتابعة موصولةٌ بخطٍّ لأن جلسة المختبر واحدةٌ
 * للإقليم كلِّه: ما جُبل في لقطةٍ يبقى مجبولاً في التي تليها.
 */
import type { AnyBlock, Shot as ShotT } from '../lib/types';
import { inline } from '../lib/md';
import { Prose } from './Prose';
import { Panel } from './Panel';
import { CodeBlock } from './CodeBlock';
import { PredictionGate } from './PredictionGate';
import { SummaryTable } from './SummaryTable';
import { Exercise } from './Exercise';
import { Seed } from './Seed';
import { Figure } from './Figure';

const PROGRAMS = '../../programs/';   // رابطٌ نسبيٌّ من صفحة الإقليم إلى ملفّ البرنامج

export function BlockView({ block }: { block: AnyBlock }) {
  switch (block.kind) {
    case 'prose':    return <Prose html={block.html} />;
    case 'code':     return <CodeBlock code={block.code} lang={block.lang} name={block.part} />;
    case 'panel':    return <Panel block={block} />;
    case 'part':     return (
      <CodeBlock
        code={block.code}
        lang={block.lang}
        name={block.program}
        href={PROGRAMS + block.program}
      />
    );
    case 'summary':  return <SummaryTable rows={block.rows} />;
    case 'exercise': return <Exercise count={block.count} html={block.html} />;
    case 'seed':     return <Seed html={block.html} />;
    case 'figure':   return <Figure html={block.html} />;
    case 'gate':     return null;   // البوّابة تلفّ ما بعدها، فتُعالَج في `Shot`
  }
}

/** البوّابة تقفل اللوحة التي تليها، فتُلَفّ بها بدل أن تُعرَض وحدها. */
function wrap(blocks: AnyBlock[]): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (b.kind === 'gate') {
      const next = blocks[i + 1];
      if (next) {
        out.push(
          <PredictionGate id={b.id} askHtml={b.askHtml} key={b.id}>
            <BlockView block={next} />
          </PredictionGate>
        );
        i++;
        continue;
      }
    }
    out.push(<BlockView block={b} key={i} />);
  }
  return out;
}

export function Shot({ shot, n }: { shot: ShotT; n: number }) {
  return (
    <article className="shot" id={shot.id}>
      <div className="shot__head">
        <span className="shot__n">{String(n).padStart(2, '0')}</span>
        <h2 dangerouslySetInnerHTML={{ __html: inline(shot.title) }} />
      </div>
      <div className="shot__body">{wrap(shot.blocks)}</div>
    </article>
  );
}
