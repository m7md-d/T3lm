/**
 * الفصول — المصدر الوحيد `../../../regions/*.md` (الثابت ٤).
 * هذه الوحدة تعطي البنية، والتصريف إلى كتل في `./compile.ts`.
 */
import { splitRegion } from '../lib/chapter';
import { html, inline, toLatinDigits } from '../lib/md';
import { compileShot } from './compile';
import type { Region } from '../lib/types';

const files = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const NAME = /\/(\d\d)-(.+)\.md$/;

export const regions: Region[] = Object.entries(files)
  .map(([path, raw]) => {
    const m = NAME.exec(path)!;
    const n = Number(m[1]);
    const r = splitRegion(raw);
    /* رقمُ الفصل يفتح كلَّ عنوان وهو معروضٌ بجانبه ⇒ يُحذَف من العرض
       ويبقى في المصدر (الحقل الثابت ليس معلومة). */
    const short = r.title.replace(/^الفصل\s+[٠-٩0-9]+\s*—\s*/, '');
    return {
      n,
      num: m[1]!,
      slug: m[2]!,
      title: r.title,
      titleHtml: inline(r.title),
      shortHtml: inline(short),
      short,
      intro: html(r.intro),
      exercise: r.exercise ? compileShot(r.exercise) : undefined,
      next: r.next,
      shots: r.shots.map((s, i) => ({
        id: `${m[1]}-${i}`,
        n: i,
        title: toLatinDigits(s.title),
        titleHtml: inline(s.title),
        blocks: compileShot(s.body),
      })),
    } satisfies Region;
  })
  .sort((a, b) => a.n - b.n);

export const byNum = (num: string): Region | undefined =>
  regions.find((r) => r.num === num);
