/**
 * البديهيات والحِزَم — من `../../../README.md`، جداولَ يقرؤها الموقع برمجياً.
 *
 * **ولا يُكتَب هنا نصُّ أيٍّ منها** (الثابت ٤): تعديل الجدول في الماركداون
 * يحرّك الموقع وحده. وفحصُ التصيير يقارن صفوف جدول التفصيل بما في `regions/`
 * ويفشل عند أي فرق.
 */
import raw from '../../../README.md?raw';
import type { Axiom, Pack } from '../lib/types';
import { toLatinDigits } from '../lib/md';

const CELLS = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const rowsUnder = (heading: string, upto = '\n## ') => {
  const i = raw.indexOf(heading);
  if (i < 0) return [];
  const j = raw.indexOf(upto, i + heading.length);
  return raw.slice(i, j < 0 ? undefined : j)
    .split('\n')
    .filter((l) => l.trim().startsWith('|') && !/^\|[\s|:-]+\|$/.test(l.trim()))
    .map(CELLS);
};

const strip = (s: string) => s.replace(/^\*\*|\*\*$/g, '').replace(/^`|`$/g, '');

export const axioms: Axiom[] = rowsUnder('## البديهيات الخمس')
  .filter((c) => c.length >= 3 && /^[٠-٩]$/.test(c[0] ?? ''))
  .map((c) => ({ n: c[0] ?? '', claim: c[1] ?? '', falls: c[2] ?? '' }));

/** «الطريق — خمس حِزَم»: مدًى ثم اسمٌ ثم ما تأخذه. */
export const packs: Pack[] = rowsUnder('## الطريق — خمس حِزَم', '\n### ')
  .filter((c) => c.length >= 3 && /^`\d\d–\d\d`$/.test(c[0] ?? ''))
  .map((c) => {
    const [from, to] = strip(c[0] ?? '').split('–');
    return { id: from ?? '', from: from ?? '', to: to ?? '', name: strip(c[1] ?? ''), takes: c[2] ?? '' };
  });

/** «وتفصيلُها»: سطرٌ لكل إقليم — وهو **ما يفرّق** بطاقةً عن أختها (الركيزة ٢ب). */
export const briefs: Record<string, string> = Object.fromEntries(
  rowsUnder('### وتفصيلُها')
    .filter((c) => c.length >= 3 && /^`\d\d`$/.test(c[0] ?? ''))
    /* «✅» في كل صفٍّ من الثلاثة والعشرين ⇒ قيمةٌ واحدة لكل العناصر، فزخرفة */
    .map((c) => [strip(c[0] ?? ''), (c[2] ?? '').replace(/^✅\s*/, '')])
);

/** «السلطات»: أربعةُ وسوم، ومعناها. تُعرَض شرحاً للوسم في اللوحات. */
export const authorities: [string, string][] = rowsUnder('## السلطات')
  .filter((c) => c.length >= 2 && /^`@\w+`$/.test(c[0] ?? ''))
  .map((c) => [strip(c[0] ?? ''), c[1] ?? '']);

export { toLatinDigits };
