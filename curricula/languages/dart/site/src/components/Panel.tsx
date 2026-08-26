/**
 * لوحة المخرَج — **الأمر ومخرَجُه المسجَّل معاً**، والحكمُ ظاهرٌ قبل أن يُقرأ.
 *
 * ١) **لا زرّ تشغيل.** مشغّل المتصفّح يمرّ بـJavaScript، والفرق في **الجواب**
 *    لا في صيغته: `1.0 is int` كاذبةٌ على الآلة الأصلية وصادقةٌ هناك. فالأمر
 *    معروضٌ ليُنسَخ ويُشغَّل عند القارئ، والمخرَج مسجَّلٌ من تشغيل المؤلّف.
 * ٢) **اللون حكمٌ، والوسم آلة.** محوران مستقلّان: قَبِلت أم رَفَضت (ثلاث فئات
 *    لون)، ومن أنتجها (`@vm` · `@web` · `@aot` · `C` · `$`) وسماً نصّياً.
 * ٣) **الأرقام المتقلّبة تُعلَن ولا تُقارَن** — حيث كتب المؤلّف `<!-- runs -->`.
 * ٤) والعربية في المخرَج تعود إلى خطّ المتن (`../lib/dartlex.ts`): تسعٌ
 *    وخمسون لوحةً من ١٤٣ تطبع نصّاً عربياً، والخليّةُ الأحادية تفكّ وصله.
 */
import { highlightToHtml as paintSh } from '@t3lm/kit/highlight/sh';
import { Dices } from 'lucide-react';
import type { Panel as PanelT } from '../lib/types';
import { VERDICT_MEANS } from '../lib/machine';
import { paintLines } from '../lib/dartlex';
import { MachineTag } from './MachineTag';
import { CopyButton } from './CopyButton';

const VERDICT_LABEL: Record<PanelT['verdict'], string> = {
  ok: 'عمل',
  no: 'رُفِض',
  c: 'المرساة',
};

/**
 * المخرَج سطراً سطراً، ولكلٍّ `dir="auto"`: أوّلُ حرفٍ قويٍّ في السطر يحدّد
 * اتّجاهه، وهو ما تفعله الطرفية التي طبعته. ولوحةٌ واحدةٌ باتّجاهٍ واحد تقلب
 * أسطرها العربية.
 */
function Out({ text, volatile: vol }: { text: string; volatile: boolean }) {
  return (
    <div className="panel__out en">
      {paintLines(text, vol).map((l, i) => (
        <div className="oline" dir="auto" key={i} dangerouslySetInnerHTML={{ __html: l || '&nbsp;' }} />
      ))}
    </div>
  );
}

export function Panel({ block }: { block: PanelT }) {
  return (
    <figure className="panel" data-verdict={block.verdict}>
      <figcaption className="panel__bar">
        <span className="panel__verdict" title={VERDICT_MEANS[block.verdict]}>
          {VERDICT_LABEL[block.verdict]}
        </span>
        <MachineTag machine={block.machine} dir={block.dir} />
        {block.volatile ? (
          <span className="panel__vol" title="أرقامها تختلف بين تشغيلين — والثابت هو النسبة">
            <Dices aria-hidden />
            <span>أرقامٌ لا تتكرّر</span>
          </span>
        ) : null}
        <span className="spacer" />
        {block.command ? <CopyButton text={block.command} label="انسخ الأمر" /> : null}
      </figcaption>

      {block.steps?.length ? (
        block.steps.map((s, i) => (
          <div className="panel__step" key={i}>
            <pre className="panel__cmd en" dangerouslySetInnerHTML={{ __html: paintSh(s.cmd, 'sh') }} />
            {s.out ? <Out text={s.out} volatile={block.volatile} /> : null}
          </div>
        ))
      ) : (
        <>
          {block.command ? (
            <pre className="panel__cmd en" dangerouslySetInnerHTML={{ __html: paintSh(block.command, 'sh') }} />
          ) : null}
          <div className="panel__crease"><span>مخرَجٌ مسجَّل</span></div>
          <Out text={block.output} volatile={block.volatile} />
        </>
      )}
    </figure>
  );
}
