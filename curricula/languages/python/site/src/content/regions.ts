/**
 * الأقاليم — المصدر الوحيد `../../../regions/*.md` (الثابت ٤).
 * هذه الوحدة تعطي البنية، والتصريف إلى بلوكات في `./compile.ts`.
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
    return {
      n,
      num: m[1]!,
      slug: m[2]!,
      title: r.title,
      titleHtml: inline(r.title),
      /* «الإقليم NN — » يتكرّر في كل عنوان، والرقم معروضٌ بجانبه ⇒ يُحذَف
         من العرض ويبقى في المصدر (الحقل الثابت ليس معلومة). */
      shortHtml: inline(r.title.replace(/^الإقليم\s+[٠-٩0-9]+\s*—\s*/, '')),
      short: r.title.replace(/^الإقليم\s+[٠-٩0-9]+\s*—\s*/, ''),
      intro: html(r.intro),
      exercise: r.exercise ? compileShot(r.exercise) : undefined,
      summary: r.summary ? compileShot(r.summary) : undefined,
      shots: r.shots.map((s, i) => ({
        id: `${m[1]}-${i}`,
        n: i,
        title: toLatinDigits(s.title),
        titleHtml: inline(s.title),
        part: s.part,
        partIntro: s.partIntro ? html(s.partIntro) : undefined,
        blocks: compileShot(s.body),
      })),
    } satisfies Region;
  })
  .sort((a, b) => a.n - b.n);

export const byNum = (num: string): Region | undefined =>
  regions.find((r) => r.num === num);
