/**
 * القسم: ادّعاءٌ + دليله + مكسبه. نهايتُه مرئيةٌ من بدايته، والانتقال بضغطةٍ
 * واحدةٍ في نفس الموضع دائماً — ولا تقدّمَ تلقائيّ.
 *
 * وشريطُه **للقسم نفسه** لا للمنهج: لا عدَّ تنازلياً ولا نسبة إنجاز.
 */
import { Blocks } from './Blocks';
import { Lab } from './Lab';
import { labs } from '../content/labs';
import type { Shot as ShotT } from '../lib/types';

export function Shot({ shot, region, count }: { shot: ShotT; region: string; count: number }) {
  return (
    <article className="shot">
      <h1 className="shot__title" dangerouslySetInnerHTML={{ __html: shot.titleHtml }} />
      <div className="shot__meter" aria-hidden>
        <i style={{ width: `${((shot.n + 1) / count) * 100}%` }} />
      </div>
      <Blocks blocks={shot.blocks} idBase={`${region}:${shot.n}`} />
      {labs
        .filter((l) => l.region === region && shot.title.includes(l.after))
        .map((l) => (
          <div className="stack" key={l.id} style={{ marginBlockStart: '1.35rem' }}>
            <Lab id={l.id} stage={l.stage} claim={l.claim} seeds={l.seeds} />
          </div>
        ))}
    </article>
  );
}

/** كلماتٌ قليلة من عنوان ما بعده: خطوةٌ محدّدةٌ رخيصة المظهر، لا قفزةٌ في المجهول.
 *  والحرفُ المعلَّق في آخرها — «أداة التحرير لا» — يُحذَف، فهو يعِد بجملةٍ لا تأتي. */
const HANGING = new Set(['لا', 'ما', 'من', 'في', 'على', 'إلى', 'عن', 'أم', 'أو', 'و', 'ثم', 'بل', 'هل']);

export const threeWords = (title: string): string => {
  const words = title.replace(/[«»]/g, '').split(/\s+/).slice(0, 4);
  while (words.length && HANGING.has(words[words.length - 1]!)) words.pop();
  return words.join(' ');
};
