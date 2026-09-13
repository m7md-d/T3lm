/** الملاحق — تُقرأ من `../../../appendix/*.md`. **المصدر الوحيد** (الثابت ٤). */
import { compileShot } from '../lib/compile';
import { idOf, splitChapter, titleOf } from '../lib/chapter';
import { plain } from '../lib/md';
import type { Block } from '../lib/types';

const files = import.meta.glob('../../../appendix/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

export interface Doc {
  slug: string;
  title: string;
  lead: Block[];
  sections: { title: string; id: string; blocks: Block[] }[];
}

export const docs: Doc[] = Object.keys(files)
  .sort((a, b) => (a.endsWith('README.md') ? -1 : b.endsWith('README.md') ? 1 : a.localeCompare(b)))
  .map((path) => {
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    const { heading, lead, shots } = splitChapter(files[path]!);
    return {
      slug,
      title: plain(titleOf(heading)) || slug,
      lead: compileShot(lead, `ap:${slug}`),
      sections: shots.map((s, i) => ({
        title: s.titleMd,
        id: idOf(s.titleMd),
        blocks: compileShot(s.body, `ap:${slug}:${i}`),
      })),
    };
  });

export const bySlug: Record<string, Doc> = Object.fromEntries(docs.map((d) => [d.slug, d]));
