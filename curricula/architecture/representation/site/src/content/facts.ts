/**
 * ما تبنيه الواجهة — **مقروءاً من الماركداون، لا مكتوباً هنا** (الثابت ٤).
 *
 * ثلاثة جداولَ في المصدر تصير ثلاثَ بنًى: الضوامن الأربعة، والانهيارات
 * الثلاثة، وحِزَم الطريق الخمس. وفحصٌ في `../../scripts/ssr-check.tsx` يفشل إن
 * فرغ أحدها — فجدولٌ يُعاد تسميته في الماركداون يُكتشَف عند البناء لا في الصفحة.
 */
import { inline } from '../lib/md';
import type { Guarantor, Pack } from '../lib/types';

const mds = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const region = (n: string) => mds[Object.keys(mds).find((p) => p.includes(`/${n}-`))!]!;

const readme = (import.meta.glob('../../../README.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>)['../../../README.md']!;

/** صفوفُ جدولٍ يبدأ بعنوانٍ فيه هذه الخليّة الأولى. */
function rows(md: string, head: string): string[][] {
  const lines = md.split('\n');
  const at = lines.findIndex((l) => l.startsWith(`| ${head} |`));
  if (at < 0) return [];
  const out: string[][] = [];
  for (let i = at + 2; i < lines.length && lines[i]!.startsWith('|'); i++) {
    out.push(lines[i]!.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  }
  return out;
}

/* ــ الضوامن الأربعة: جدول «من يضمن هذا؟» في الفصل ٠٠ ــ */
export type GuarantorRow = { id: Guarantor; tag: string; meaning: string; gives: string };

export const guarantors: GuarantorRow[] = rows(region('00'), 'الضامن').map((c) => ({
  id: c[0]!.replace(/[`@]/g, '') as Guarantor,
  tag: c[0]!.replace(/`/g, ''),
  meaning: inline(c[1]!),
  gives: c[2]!,
}));

/* ــ الانهيارات الثلاثة: جدول الطريق في آخر الفصل ٠٠ ــ */
export type Collapse = { name: string; symptom: string; dies: string; regions: string[] };

export const collapses: Collapse[] = rows(region('00'), 'الانهيار').map((c) => ({
  name: c[0]!,
  symptom: c[1]!,
  dies: inline(c[2]!),
  regions: [...c[2]!.matchAll(/`(\d\d)`/g)].map((m) => m[1]!),
}));

/* ــ حِزَم الطريق: جدول «الطريق» في الريدمي ــ */
const road = readme.split('\n');
const start = road.findIndex((l) => l.startsWith('| | `00` |'));

/* الجدولُ صفوفٌ متّصلة، ويقف عند أوّل سطرٍ ليس صفّاً — وإلّا التقط جداول
   الريدمي الأخرى وصار العدد تسعة. */
const rowsOfRoad = (() => {
  const out: string[] = [];
  for (let i = start; i < road.length && road[i]!.startsWith('|'); i++) out.push(road[i]!);
  return out;
})();

export const packs: Pack[] = rowsOfRoad
  .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
  .filter((c) => c.length === 3 && /`\d\d`/.test(c[1]!))
  .map((c) => {
    const nums = [...c[1]!.matchAll(/`(\d\d)`/g)].map((m) => Number(m[1]));
    return {
      name: c[0]!.replace(/\*\*/g, '') || 'المدخل',
      from: nums[0]!,
      to: nums[nums.length - 1]!,
      gist: inline(c[2]!),
    } satisfies Pack;
  });
