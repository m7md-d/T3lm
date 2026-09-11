/**
 * الفصول — تُقرأ من `../../../regions/*.md` وتُصرَّف. **المصدر الوحيد** (الثابت ٤).
 */
import { compileShot } from './compile';
import { splitChapter, titleOf } from '../lib/chapter';
import { html, plain, words } from '../lib/md';
import type { Block, Chapter, PanelBlock, Shot } from '../lib/types';

const files = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

/** «الفصل التالي: …» — الباب الذي يفتحه الفصل الآتي، وهو رابطه. */
const SEED = /^\*\*الفصل التالي:\*\*/;

function pullSeed(blocks: Block[]): string | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i]!;
    if (b.kind !== 'prose') continue;
    const paras = b.rawMd.split(/\n\s*\n/);
    const at = paras.findIndex((x) => SEED.test(x.trim()));
    if (at < 0) continue;
    const seed = paras[at]!.replace(SEED, '').trim();
    const rest = paras.filter((_, k) => k !== at).join('\n\n');
    if (rest.trim()) blocks[i] = { kind: 'prose', html: html(rest), rawMd: rest };
    else blocks.splice(i, 1);
    return html(seed);
  }
  return null;
}

export const chapters: Chapter[] = Object.keys(files)
  .sort()
  .map((path) => {
    const file = path.split('/').pop()!;
    const num = file.slice(0, 2);
    const raw = files[path]!;
    const { heading, lead, shots } = splitChapter(raw);

    const leadBlocks = compileShot(lead, `${num}:lead`);
    const built: Shot[] = shots.map((s, i) => ({
      titleMd: s.title,
      title: plain(s.title),
      id: s.id,
      blocks: compileShot(s.raw, `${num}:${i}`),
      words: words(s.raw),
    }));

    const seedHtml = built.length ? pullSeed(built[built.length - 1]!.blocks) : null;

    const panels: PanelBlock[] = [leadBlocks, ...built.map((s) => s.blocks)]
      .flat()
      .filter((b): b is PanelBlock => b.kind === 'panel');

    return {
      num,
      heading,
      titleMd: titleOf(heading),
      title: plain(titleOf(heading)),
      file,
      lead: leadBlocks,
      shots: built,
      seedHtml,
      panels,
    };
  });

export const byNum = new Map(chapters.map((c) => [c.num, c]));

export const chapterAt = (num: string): Chapter | undefined => byNum.get(num);

/** كل لوحات المنهج، بترتيب الفصول. */
export const allPanels: { chapter: Chapter; panel: PanelBlock }[] = chapters.flatMap((c) =>
  c.panels.map((panel) => ({ chapter: c, panel })),
);
