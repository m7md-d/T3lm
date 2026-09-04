/**
 * الحزم الخمس — تُقرأ من جدول الطريق في `../../README.md`، ولا تُكتب رقماً هنا.
 * وفحصُ الدخان يقارن ما في `regions/` بصفوف الجدول ويفشل عند أي فرق.
 */
import { inline, toLatinDigits } from '../lib/md';
import type { Pack } from '../lib/types';

const raw = (
  import.meta.glob('../../../README.md', {
    query: '?raw', import: 'default', eager: true,
  }) as Record<string, string>
)['../../../README.md']!;

const CELLS = (l: string) =>
  l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const SEP = /^\|[\s|:-]+\|$/;

/** خليّةٌ فيها رقمٌ أو رقمان بين علامتَي شرطة مائلة عكسية ⇒ مدى الأقاليم. */
function range(cell: string): [number, number] | null {
  const nums = [...cell.matchAll(/`(\d\d)`/g)].map((m) => Number(m[1]));
  if (!nums.length) return null;
  return [nums[0]!, nums[nums.length - 1]!];
}

export const packs: Pack[] = (() => {
  const lines = raw.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## الطريق'));
  const out: Pack[] = [];
  for (let i = start; i < lines.length; i++) {
    const l = lines[i]!;
    if (l.startsWith('## أدواته')) break;
    if (!l.trim().startsWith('|') || SEP.test(l.trim())) continue;
    const c = CELLS(l);
    if (c.length < 3) continue;
    const r = range(c[1]!);
    if (!r) continue;
    out.push({
      name: inline(toLatinDigits(c[0]!)),
      from: r[0],
      to: r[1],
      gist: inline(c[2]!),
      /* الخليّة الثالثة أسماءُ الفصول مفصولةً بنقطة ⇒ اسمُ كلِّ فصلٍ بموضعه.
         فالفصلُ المُعلَن ولم يُكتب يظهر باسمه، لا بحقلٍ ثابتٍ مكرّر. */
      titles: c[2]!.split('·').map((t) => inline(t.trim())),
    });
  }
  return out;
})();

/** أوّل فقرةٍ من «لمن كُتب» — تُقرأ ولا تُنسَخ في الكود. */
export const forWhom: string = (() => {
  const lines = raw.split('\n');
  const i = lines.findIndex((l) => l.startsWith('## لمن كُتب'));
  const j = lines.findIndex((l, k) => k > i && l.startsWith('## '));
  const body = lines.slice(i + 1, j).join('\n').trim();
  return inline(body.split('\n\n')[0]!);
})();
