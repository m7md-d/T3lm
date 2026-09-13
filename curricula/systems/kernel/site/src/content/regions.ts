/**
 * الفصول — تُقرأ من `../../../regions/*.md` وتُصرَّف. **المصدر الوحيد** (الثابت ٤).
 */
import { compileShot } from '../lib/compile';
import { idOf, splitChapter, stageOf, titleOf } from '../lib/chapter';
import { inline, plain, words } from '../lib/md';
import type { ArtifactRow, Block, Chapter, Panel, Shot, Trap } from '../lib/types';

const files = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

/* «الفصل التالي: …» — الباب الذي يفتحه الفصل الآتي، وهو رابطه (الركيزة ٤). */
function pullSeed(shots: Shot[]): string | null {
  for (let i = shots.length - 1; i >= 0; i--) {
    const bl = shots[i]!.blocks;
    for (let j = bl.length - 1; j >= 0; j--) {
      const b = bl[j]!;
      if (b.kind !== 'prose' || !/الفصل التالي/.test(b.html)) continue;
      bl.splice(j, 1);
      return b.html.replace(/<strong>الفصل التالي:<\/strong>\s*/, '');
    }
  }
  return null;
}

/** جدولُ الفخاخ — عمودان بعنوانَي «الفخّ» و«الصواب». */
function readTraps(body: string): Trap[] {
  const rows = body.split('\n').filter((l) => l.trim().startsWith('|'));
  return rows
    .slice(2)
    .map((r) => r.split('|').slice(1, -1).map((c) => c.trim()))
    .filter((c) => c.length >= 2)
    .map((c) => ({ trap: c[0]!, right: c[1]! }));
}

/** جدول `Artifact` — خمسةُ صفوفٍ ثابتة، وهي تعريف «مكتمل» في الأسلوب §١٠. */
function readArtifact(body: string): ArtifactRow[] {
  const rows = body.split('\n').filter((l) => l.trim().startsWith('|'));
  return rows
    .slice(2)
    .map((r) => r.split('|').slice(1, -1).map((c) => c.trim()))
    .filter((c) => c.length >= 2 && c[0])
    .map((c) => ({ label: c[0]!, body: c[1]! }));
}

/** أسئلة `Checkpoint` — مرقّمةٌ بأرقامٍ عربية، والسؤال قد يمتدّ أسطراً. */
function readCheckpoint(body: string): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  for (const line of body.split('\n')) {
    if (/^[٠-٩]+\.\s/.test(line)) {
      if (cur.length) out.push(cur.join(' ').trim());
      cur = [line.replace(/^[٠-٩]+\.\s*/, '')];
    } else if (cur.length && line.trim()) cur.push(line.trim());
    else if (cur.length && !line.trim()) { out.push(cur.join(' ').trim()); cur = []; }
  }
  if (cur.length) out.push(cur.join(' ').trim());
  return out.filter(Boolean);
}

export const chapters: Chapter[] = Object.keys(files)
  .sort()
  .map((path) => {
    const file = path.split('/').pop()!;
    const num = file.slice(0, 2);
    const raw = files[path]!;
    const { heading, lead, shots: rawShots } = splitChapter(raw);

    const traps = readTraps(rawShots.find((s) => plain(s.titleMd) === 'الفخاخ التصوّرية')?.body ?? '');
    const artifact = readArtifact(rawShots.find((s) => plain(s.titleMd) === 'Artifact')?.body ?? '');
    const checkpoint = readCheckpoint(rawShots.find((s) => plain(s.titleMd) === 'Checkpoint')?.body ?? '');

    const shots: Shot[] = rawShots.map((s, i) => {
      const { stage, sub } = stageOf(s.titleMd);
      return {
        titleMd: s.titleMd,
        title: plain(s.titleMd),
        stage,
        sub,
        id: idOf(s.titleMd),
        blocks: compileShot(s.body, `${num}:${i}`),
        words: words(s.body),
      };
    });

    const seedHtml = pullSeed(shots);
    const leadBlocks: Block[] = compileShot(lead, `${num}:lead`);
    const panels: Panel[] = [leadBlocks, ...shots.map((s) => s.blocks)]
      .flat()
      .filter((b): b is Panel => b.kind === 'panel');

    const titleMd = titleOf(heading);
    return {
      num,
      file,
      heading,
      titleMd,
      title: plain(titleMd),
      lead: leadBlocks,
      shots,
      seedHtml,
      traps,
      artifact,
      checkpoint,
      panels,
      axioms: [...new Set([...raw.matchAll(/البديهية ([٠-٩])/g)].map((m) => m[1]!))],
    };
  });

export const byNum: Record<string, Chapter> = Object.fromEntries(chapters.map((c) => [c.num, c]));

export const titleHtml = (c: Chapter): string => inline(c.titleMd);
