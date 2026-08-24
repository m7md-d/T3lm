/**
 * الماركداون في `../regions` و`../appendix` و`../README.md` هو المصدر الوحيد —
 * يُقرأ ولا يُنسَخ (ثابت ٤).
 */
import { parseChapter, type Chapter } from '@t3lm/kit/md';
import { toBlocks, buildShots, type Shot } from './structure';
import type { Layout } from './layout';

const files = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const readme = import.meta.glob('../../../README.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const vocab = import.meta.glob('../../../appendix/vocabulary.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

export interface Region {
  num: string;
  title: string;
  /** أوّل جملةٍ من نبذة الفصل — ادّعاؤه بكلماته هو، لا وسمٌ مكرّر */
  hook: string;
  chapter: Chapter;
}

function hookOf(lead: string): string {
  const first = lead
    .replace(/^> ?/gm, '')
    .split(/```/)[0]!
    .split(/\n\s*\n/)[0]!
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cut = first.search(/[.؟!](\s|$)/);
  return (cut > 40 ? first.slice(0, cut + 1) : first).replace(/\s*[:：]$/, '');
}

export const regions: Region[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => {
    const name = path.split('/').pop()!.replace(/\.md$/, '');
    const chapter = parseChapter(raw);
    const [head, ...rest] = chapter.heading.split('—');
    const title = rest.length ? rest.join('—').trim() : chapter.heading.trim();
    void head;
    return { num: name.slice(0, 2), title, hook: hookOf(chapter.lead), chapter };
  });

export const intro: Chapter = parseChapter(Object.values(readme)[0] ?? '');
export const glossary: Chapter = parseChapter(Object.values(vocab)[0] ?? '');

function rows(md: string, cols: number): string[][] {
  const re = new RegExp(`^\\|${'([^|\\n]+)\\|'.repeat(cols)}\\s*$`, 'gm');
  return [...md.matchAll(re)]
    .map((m) => m.slice(1, cols + 1).map((c) => c.trim()))
    .filter((r) => !/^-+:?$/.test(r[0]!));
}

/** الطريق كما يعلنه `README.md` — مصدرٌ واحد للعدد والأسماء والمحتويات. */
export interface Stop { num: string; title: string; gist: string }

export const ROAD: Stop[] = (() => {
  const sec = intro.sections.find((x) => /^الطريق/.test(x.title));
  return rows(sec?.raw ?? '', 3)
    .filter((r) => /^`\d\d`$/.test(r[0]!))
    .map((r) => ({
      num: r[0]!.replace(/`/g, ''),
      title: r[1]!.replace(/\*\*/g, '').trim(),
      gist: r[2]!,
    }));
})();

export const sealed: Stop[] = ROAD.filter((s) => !regions.some((r) => r.num === s.num));

/** المبادئ الخمسة — تُقرأ من جدول `README.md`، ولا تُكتب في الكود. */
export interface Principle { n: string; short: string; falls: string }

export const PRINCIPLES: Principle[] = (() => {
  const sec = intro.sections.find((x) => /^المبادئ الخمسة/.test(x.title));
  return rows(sec?.raw ?? '', 3)
    .filter((r) => /^[٠-٩]+$/.test(r[0]!))
    .map((r) => ({ n: r[0]!, short: r[1]!, falls: r[2]! }));
})();

/** التغييرات الخمسة — من جدول `README.md` كذلك. */
export interface Change { id: string; label: string; measures: string }

export const CHANGES: Change[] = (() => {
  const sec = intro.sections.find((x) => /^التغييرات الخمسة/.test(x.title));
  return rows(sec?.raw ?? '', 3)
    .filter((r) => /^`C\d`$/.test(r[0]!))
    .map((r) => ({ id: r[0]!.replace(/`/g, ''), label: r[1]!, measures: r[2]! }));
})();

/**
 * كل هيكلٍ في المنهج مع تقريره — **مرتّبٌ بترتيب ظهوره**.
 *
 * ومنه تُبنى المقارنة بالفصل السابق: نصّ المنهج يقول إن كل فصلٍ يُشرَح بفرقه
 * عمّا سبقه، فاللوحة تعرض الفرق.
 */
export interface Measured { region: string; layout: Layout; report: string }

export const measured: Measured[] = regions.flatMap((r) => {
  /* الهيكل في لقطةٍ ولوحتُه في التي بعدها — فالبحث عبر الفصل كلّه لا داخل لقطة */
  const blocks = r.chapter.sections.flatMap((s) => toBlocks(s.raw, r.num));
  const out: Measured[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (b.type !== 'layout') continue;
    const panel = blocks.slice(i + 1).find((x) => x.type === 'report' || x.type === 'gate');
    out.push({
      region: r.num,
      layout: b.layout,
      report: panel && 'text' in panel ? panel.text : '',
    });
  }
  return out;
});

/** قراءةُ لوحةٍ إلى مقاييس — الترتيب نفسه في كل فصل، فالمقارنة بالموضع. */
export interface Reading { files: number; pkgs: number; crossing: string; chain: number; reaches: string; violations: number; doubles: string; changes: { id: string; files: string }[] }

export function readReport(text: string): Reading | null {
  const m = (re: RegExp) => text.match(re);
  const head = m(/ملفّات (\d+) · حزم (\d+)/);
  if (!head) return null;
  return {
    files: Number(head[1]),
    pkgs: Number(head[2]),
    crossing: m(/حوافّ تعبر المجلّد الأعلى: (\S+ من \S+)/)?.[1] ?? '—',
    chain: Number(m(/أطول سلسلة استيراد: (\d+)/)?.[1] ?? 0),
    reaches: m(/القائد يصل إلى المقود: ([^\n]+)/)?.[1]?.trim() ?? '—',
    violations: Number(m(/مخالفات (\d+)/)?.[1] ?? 0),
    doubles: m(/بدائل يلزمها اختبار القلب: ([^\n]+)/)?.[1]?.split('(')[0]?.trim() ?? '—',
    changes: [...text.matchAll(/^ {2}(C\d) .+?\s{2,}(— لا مالك لهذا الاهتمام|\d+ · +\d+)/gm)]
      .map((x) => ({ id: x[1]!, files: x[2]!.replace(/\s+/g, ' ').trim() })),
  };
}

/**
 * لقطات الفصل كما تُعرَض — «مشروعٌ يستفيد» و«ومثالٌ مضادّ» لقطةٌ واحدة.
 *
 * الدمج هنا لا في الصفحة، لأن **موضعَ اللقطة** يُشار إليه من مكانين: التنقّل
 * في الفصل، و«ما توقّعتَه» في الواجهة. ومنطقان للدمج يعطيان رقمين مختلفين.
 */
export type PairedShot = Shot & { pair?: Shot };

export function shotsOf(r: Region): PairedShot[] {
  const raw = buildShots(r.chapter.sections, r.num);
  const out: PairedShot[] = [];
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i]!;
    const b = raw[i + 1];
    if (/^مشروعٌ يستفيد/.test(a.title) && b && /^ومثالٌ مضادّ/.test(b.title)) {
      out.push({ ...a, title: 'يستفيد · ومضادّ', pair: b });
      i++;
    } else out.push(a);
  }
  return out;
}
