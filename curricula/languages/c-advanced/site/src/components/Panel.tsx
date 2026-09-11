/**
 * اللوحة — البرنامج، ثم ما بينهما من نثر، ثم المخرَج ومصدرُه.
 *
 * وثلاثة قيودٍ عليها، كلُّها من المنهج نفسه:
 *   · تحمل مصدرها دائماً — والفصل ٠٠ يجعل غيابَه عيباً في اللوحة.
 *   · تقول **كيف** تحقّق الفاحص منها، ولا تقول «نجحت»: حكمُ الغياب مكتوبٌ في
 *     README المنهج، والتشغيل شاهدٌ لا برهان.
 *   · بلا زرّ تشغيل: جوابُ مفسّرٍ في المتصفّح يخالف جواب المختبر لا صيغتَه.
 */
import { CodeBlock } from './CodeBlock';
import { FullProgram } from './FullProgram';
import { GradeTag } from './GradeTag';
import { OutputBlock } from './OutputBlock';
import { Predict } from './Predict';
import { Prose } from './Prose';
import { SourceTag } from './SourceTag';
import type { PanelBlock } from '../lib/types';

export function Panel({ p }: { p: PanelBlock }) {
  const out = (
    <>
      <div className="panel-head">
        <span className="panel-label">المخرَج</span>
        {p.tag && p.family ? <SourceTag tag={p.tag} family={p.family} note={p.note} /> : null}
      </div>
      <OutputBlock text={p.output} />
    </>
  );

  return (
    <section className={`panel panel-${p.family ?? 'manual'}`}>
      {p.code ? (
        <>
          <div className="panel-head">
            <span className="panel-label">البرنامج</span>
            {p.program ? <code className="panel-prog en">programs/{p.program}</code> : null}
          </div>
          <CodeBlock code={p.code} lang={p.lang} />
        </>
      ) : null}

      {p.midHtml ? <Prose html={p.midHtml} /> : null}

      {p.askHtml ? <Predict id={p.id} askHtml={p.askHtml}>{out}</Predict> : out}

      <footer className="panel-foot">
        <GradeTag grade={p.grade} />
        {p.program ? <FullProgram name={p.program} /> : null}
      </footer>
    </section>
  );
}
