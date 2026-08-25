/**
 * الأقاليم — المصدر الوحيد `../../regions/*.md` (الثابت ٤).
 *
 * هذه الوحدة تعطي **البنية**: الرقم والعنوان واللقطات. أمّا تحويل كل لقطةٍ إلى
 * بلوكات — لوحةٌ مسجَّلة، وبوّابة، ومقتطف برنامج — فهو `compile.ts`، وهو ما
 * تملؤه الخطوة التالية.
 */
import { splitRegion } from '../lib/chapter';
import { html } from '../lib/md';
import { compileShot } from './compile';
import type { ExerciseBlock, Region, SeedBlock, SummaryBlock, SummaryRow } from '../lib/types';

/* العدد مكتوبٌ في العنوان نفسه: «التمرين — اثنان، ولا حلول». */
const COUNT: Record<string, number> = { واحد: 1, اثنان: 2, ثلاثة: 3, أربعة: 4, خمسة: 5 };

/** جدول «ما عرفتَه \| العقدة» ⇒ حوافُّ شبكة المهارات. */
function tableRows(md: string): SummaryRow[] {
  return md.split('\n')
    .filter((l) => l.trim().startsWith('|') && !/^\|[\s|:-]+\|$/.test(l.trim()))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    .filter((c) => c.length >= 2 && !/^ما عرفتَه$/.test(c[0] ?? ''))
    .map((c) => ({ learned: c[0] ?? '', node: c[1] ?? '' }));
}

/** البذرة: آخر اقتباسٍ في الخلاصة، وهو ما يفتحه الإقليم القادم. */
function seedOf(md: string): SeedBlock | undefined {
  const i = md.indexOf('> **البذرة');
  if (i < 0) return undefined;
  const body = md.slice(i).split('\n')
    .filter((l) => l.startsWith('>'))
    .map((l) => l.replace(/^>\s?/, ''))
    .join('\n')
    .replace(/^\*\*البذرة:\*\*\s*/, '');
  return { kind: 'seed', html: html(body) };
}

const files = import.meta.glob('../../../regions/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const NAME = /\/(\d\d)-(.+)\.md$/;

export const regions: Region[] = Object.entries(files)
  .map(([path, md]): Region | null => {
    const m = NAME.exec(path);
    if (!m) return null;
    const [, no, slug] = m as unknown as [string, string, string];
    const raw = splitRegion(md);

    /* الخلاصة والتمرين ليسا لقطتين: هما **أرضيّة الإقليم** التي ينغلق عندها،
       فيُنتزعان من التسلسل ويُعرَضان بعد آخر لقطة. */
    const sumRaw = raw.shots.find((s) => s.title.startsWith('الخلاصة'));
    const exRaw = raw.shots.find((s) => s.title.startsWith('التمرين'));
    const shots = raw.shots.filter((s) => s !== sumRaw && s !== exRaw);

    const summary: SummaryBlock | undefined = sumRaw
      ? { kind: 'summary', rows: tableRows(sumRaw.raw) }
      : undefined;
    const exercise: ExerciseBlock | undefined = exRaw
      ? {
          kind: 'exercise',
          count: COUNT[exRaw.title.replace(/^التمرين\s*—\s*/, '').split('،')[0]?.trim() ?? ''] ?? 0,
          html: html(exRaw.raw),
        }
      : undefined;

    return {
      no,
      slug,
      title: raw.heading,
      leadHtml: html(raw.lead),
      shots: shots.map((s) => ({
        id: s.id,
        title: s.title,
        part: s.part,
        blocks: compileShot(s.raw, `${no}:${s.id}`),
      })),
      summary,
      exercise,
      seed: sumRaw ? seedOf(sumRaw.raw) : undefined,
    };
  })
  .filter((r): r is Region => r !== null)
  .sort((a, b) => a.no.localeCompare(b.no));

export const regionOf = (no: string) => regions.find((r) => r.no === no);
export const nextOf = (no: string) => regions[regions.findIndex((r) => r.no === no) + 1];
