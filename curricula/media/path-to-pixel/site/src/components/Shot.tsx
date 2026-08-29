/**
 * اللقطة: ادّعاءٌ + دليله + مكسبه. نهايتُها مرئيةٌ من بدايتها، والانتقال بضغطةٍ
 * واحدةٍ في نفس الموضع دائماً — ولا تقدّمَ تلقائيّ.
 *
 * وشريطُها **للّقطة نفسها** لا للمنهج: لا عدَّ تنازلياً ولا نسبة إنجاز.
 */
import { Blocks, Prose } from './Blocks';
import { FillRuleLab } from './labs/FillRule';
import { HairlineLab } from './labs/Hairline';
import { SamplesLab } from './labs/Samples';
import { labs } from '../content/labs';
import type { Shot as ShotT } from '../lib/types';

const LABS: Record<string, () => React.JSX.Element | null> = {
  fillrule: FillRuleLab, samples: SamplesLab, hairline: HairlineLab,
};

export function Shot({ shot, region, count }: { shot: ShotT; region: string; count: number }) {
  return (
    <article className="shot">
      {shot.part && <div className="shot__part">{shot.part}</div>}
      <h1 className="shot__title" dangerouslySetInnerHTML={{ __html: shot.titleHtml }} />
      <div className="shot__meter" aria-hidden>
        <i style={{ width: `${((shot.n + 1) / count) * 100}%` }} />
      </div>
      {shot.partIntro && <Prose className="shot__intro prose-wrap" html={shot.partIntro} />}
      <Blocks
        blocks={shot.blocks}
        idBase={`${region}:${shot.n}`}
        tail={labs
          .filter((l) => l.region === region && shot.title.includes(l.after))
          .map((l) => {
            const El = LABS[l.id];
            return El ? <El key={l.id} /> : null;
          })}
      />
    </article>
  );
}

/** ثلاث كلماتٍ من عنوان ما بعده: خطوةٌ محدّدةٌ رخيصة المظهر، لا قفزةٌ في المجهول. */
export const threeWords = (title: string): string =>
  title.replace(/[«»]/g, '').split(/\s+/).slice(0, 3).join(' ');
