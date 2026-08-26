/**
 * الأقاليم — المصدر الوحيد `../../../regions/*.md` (الثابت ٤).
 *
 * هذه الوحدة تعطي البنية: الرقم والعنوان واللقطات وأرضيّة الإقليم. وتحويل كل
 * لقطةٍ إلى بلوكات في `./compile.ts`.
 *
 * والخلاصةُ والتمرينُ والبذرة ليست لقطات: هي **أرضيّة الإقليم** التي ينغلق
 * عندها، فتُنتزَع من التسلسل وتُعرَض بعد آخر لقطة.
 */
import { splitRegion } from '../lib/chapter';
import { html, inline, toLatinDigits } from '../lib/md';
import { compileShot } from './compile';
import type { Region, SummaryRow } from '../lib/types';

const files = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const NAME = /\/(\d\d)-(.+)\.md$/;
const CELLS = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const SEP = /^\|[\s|:-]+\|$/;

/** ثلاثة أعمدة في المصدر، والثالث **روابط أمامية** حين يكون أرقام أقاليم. */
function summaryOf(md: string): { head: string[]; rows: SummaryRow[] } {
  const lines = md.split('\n').filter((l) => l.trim().startsWith('|'));
  const head = lines[0] ? CELLS(lines[0]) : [];
  const rows = lines
    .slice(1)
    .filter((l) => !SEP.test(l.trim()))
    .map(CELLS)
    .filter((c) => c.length >= 3)
    .map((c) => ({
      saw: c[0] ?? '',
      axiom: c[1] ?? '',
      nextRaw: c[2] ?? '',
      next: (c[2] ?? '').match(/[٠-٩]{2}/g)?.map(toLatinDigits) ?? [],
    }));
  return { head, rows };
}

export const regions: Region[] = Object.entries(files)
  .map(([path, md]): Region | null => {
    const m = NAME.exec(path);
    if (!m) return null;
    const [, no, slug] = m as unknown as [string, string, string];
    const raw = splitRegion(md);

    const floorOf = (t: string) => raw.shots.find((s) => s.title.startsWith(t));
    const sum = floorOf('الخلاصة');
    const ex = floorOf('التمرين');
    const seed = floorOf('البذرة');
    const floor = new Set([sum, ex, seed]);
    const shots = raw.shots.filter((s) => !floor.has(s));

    const table = sum ? summaryOf(sum.raw) : { head: [], rows: [] };

    return {
      no,
      slug,
      title: raw.heading,
      name: raw.heading.replace(/^الإقليم\s+\S+\s*—\s*/, ''),
      leadHtml: html(raw.lead),
      parts: raw.parts,
      shots: shots.map((s) => ({
        id: s.id,
        title: s.title,
        ...(s.part ? { part: s.part } : {}),
        blocks: compileShot(s.raw, `${no}:${s.id}`),
      })),
      summary: table.rows,
      summaryHead: table.head,
      ...(ex ? { exerciseHtml: html(ex.raw) } : {}),
      ...(seed ? { seedHtml: html(seed.raw) } : {}),
    } as Region;
  })
  .filter((r): r is Region => r !== null)
  .sort((a, b) => a.no.localeCompare(b.no));

export const regionOf = (no: string) => regions.find((r) => r.no === no);
export const nextOf = (no: string) => regions[regions.findIndex((r) => r.no === no) + 1];
export const titleHtml = (no: string) => {
  const r = regionOf(no);
  return r ? inline(r.name) : no;
};
