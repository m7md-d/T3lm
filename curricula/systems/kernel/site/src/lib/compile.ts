/**
 * تصريف جسم اللقطة إلى بلوكات — **بمفردات `../../tools/verify.py` نفسها**،
 * فلا يفترق ما يُعرَض عمّا يُتحقَّق منه:
 *
 *   `<!-- runs: NN -->`     اللوحة التالية مخرَجُ إقلاع المرحلة `NN`
 *   `<!-- part: PATH -->`   البلوك التالي مقتطعٌ من `programs/PATH`
 *   `<!-- out @tag: … -->`  الكتلة التالية لوحةُ مخرَج، ووسمُ سلطتها إلزاميّ
 *
 * و`runs` يُستهلَك عند **اللوحة** لا عند الكود الذي بينهما — كما يفعل الفاحص
 * حرفياً، لأن المرحلة تنسب المخرَج لا المقتطع.
 */
import { html, inline, plain, slugify, words } from './md';
import type { Block, Panel, Tag } from './types';

const RUNS = /^<!--\s*runs:\s*(\S+)\s*-->\s*$/;
const PART = /^<!--\s*part:\s*(\S+)\s*-->\s*$/;
const OUT = /^<!--\s*out\s+@(\w+)\s*:\s*(.*?)\s*-->\s*$/;
const FENCE = /^```([\w.+-]*)\s*$/;
const H3 = /^###\s+(.+)$/;

/** وسمٌ بنيويّ يتكرّر بلا تنويع — تعرضه اللوحة نفسها ترويسةً لها. */
const LABEL = /^\*\*([^*]{1,24})\*\*\s*$/;

/** فقرةُ حدٍّ على الادّعاء الذي قبلها — الرمز نفسه قناتُها الثانية. */
const LIMIT = /^⚠\s*/;

/** مسار التنفيذ: كتلةٌ بلا لغة تفصل خطواتِها `↓` — سُلَّمٌ لا `pre`. */
const isTrace = (lang: string, body: string[]) => !lang && body.some((l) => l.includes('↓'));

function flushProse(buf: string[], out: Block[]) {
  const chunk = buf.join('\n');
  buf.length = 0;
  if (!chunk.trim()) return;
  /* الفقرة التي تبدأ بـ⚠ تُفصَل بلوكاً، وما حولها يبقى نثراً */
  for (const para of chunk.split(/\n\s*\n/)) {
    const p = para.trim();
    if (!p) continue;
    if (LIMIT.test(p)) out.push({ kind: 'limit', html: html(p.replace(LIMIT, '')) });
    else out.push({ kind: 'prose', html: html(p) });
  }
}

export function compileShot(body: string, key: string): Block[] {
  const lines = body.split('\n');
  const out: Block[] = [];
  const buf: string[] = [];

  let pendRun: string | null = null;
  let pendPart: string | null = null;
  let pendLabel: string | null = null;
  let n = 0;

  const readFence = (i: number): { lang: string; body: string[]; next: number } => {
    const lang = lines[i]!.match(FENCE)![1] ?? '';
    let k = i + 1;
    const b: string[] = [];
    while (k < lines.length && !lines[k]!.startsWith('```')) b.push(lines[k++]!);
    return { lang, body: b, next: k + 1 };
  };

  let i = 0;
  while (i < lines.length) {
    const ln = lines[i]!;

    let m = ln.match(RUNS);
    if (m) { pendRun = m[1]!; i++; continue; }

    m = ln.match(PART);
    if (m) { pendPart = m[1]!; i++; continue; }

    m = ln.match(OUT);
    if (m) {
      const tag = m[1] as Tag;
      const note = m[2] ?? '';
      let j = i + 1;
      while (j < lines.length && !lines[j]!.trim()) j++;
      if (j < lines.length && FENCE.test(lines[j]!)) {
        flushProse(buf, out);
        const f = readFence(j);
        const panel: Panel = {
          kind: 'panel',
          id: `${key}:${n++}`,
          titleMd: pendLabel,
          tag,
          note,
          stage: pendRun,
          text: f.body.join('\n'),
        };
        out.push(panel);
        pendRun = null;
        pendLabel = null;
        i = f.next;
        continue;
      }
      i++;
      continue;
    }

    m = ln.match(H3);
    if (m) {
      flushProse(buf, out);
      const titleMd = m[1]!.trim();
      out.push({ kind: 'head', titleMd, title: plain(titleMd), id: slugify(plain(titleMd)) });
      i++;
      continue;
    }

    if (FENCE.test(ln)) {
      flushProse(buf, out);
      const f = readFence(i);
      if (isTrace(f.lang, f.body)) {
        const steps = f.body
          .join('\n')
          .split('\n')
          .map((l) => l.replace(/^\s*↓\s*/, '').trim())
          .filter(Boolean)
          .map((s) => ({ md: s, html: inline(s) }));
        out.push({ kind: 'trace', steps });
      } else {
        out.push({ kind: 'code', lang: f.lang || 'text', code: f.body.join('\n'), file: pendPart });
      }
      pendPart = null;
      pendLabel = null;
      i = f.next;
      continue;
    }

    const lab = ln.trim().match(LABEL);
    if (lab) { flushProse(buf, out); pendLabel = lab[1]!; i++; continue; }

    if (pendLabel && ln.trim()) { buf.push(`**${pendLabel}**`); pendLabel = null; }
    buf.push(ln);
    i++;
  }

  if (pendLabel) buf.push(`**${pendLabel}**`);
  flushProse(buf, out);
  return out;
}

/** عددُ كلمات نثر اللقطة — لفحص حدّها. */
export const shotWords = (body: string): number => words(body);
