import { marked, type Tokens } from 'marked';
import { slugify } from '@t3lm/kit/md';
import type { Section } from '@t3lm/kit/md';

/**
 * تقسيم اللقطة إلى بلوكات — **مفردات هذا المنهج تحديداً**.
 *
 * ومفرداته أربع، وثلاثٌ منها مشتركة مع أي منهج: نصّ، وكود، ومخرَج مسجَّل،
 * وبوّابة تنبّؤ. **والرابعة تخصّه: رفض المترجم.**
 *
 * والرفض بلوكٌ قائم بذاته لا مخرَجٌ ملوَّن، لأن المنهج يستعمله **دليلاً**: ثمانيةٌ
 * منه في فصلين، ولكلٍّ رمزٌ (`E0502`) يفتح صفحةً كاملة بأمر `rustc --explain`.
 *
 * **ولا زرّ تشغيل في هذا الموقع** (`README.md` §الاشتقاق): Rust تُترجَم، ولا مفسّر
 * لها في المتصفّح يعطي جواب `rustc` — وأكثر ما يُدرَّس هنا **رفضٌ** لا يقع إلا في
 * مترجمٍ حقيقيّ.
 */
export type Block =
  | { type: 'md'; html: string }
  | { type: 'code'; code: string; lang: string; id: string }
  | { type: 'out'; text: string; note?: string }
  | { type: 'err'; text: string; code?: string }
  | { type: 'gate'; output: string; id: string; note?: string }
  | { type: 'local'; code: string }
  | { type: 'figure'; text: string };

export interface Station {
  id: string;
  title: string;
  blocks: Block[];
}

/** بذرة الغموض تُنهي الإقليم ببابٍ إلى ما بعده. */
export const SEED = 'بذرة';

const OUT = /^<!--\s*out(?::\s*([\s\S]*?))?\s*-->\s*$/;
const ERR = /^<!--\s*err(?::\s*([\s\S]*?))?\s*-->\s*$/;
const html = (t: Tokens.Generic) => marked.parser([t as never]);

/** نوعُ أوّل بلوكٍ حقيقيّ بعد الموضع — متجاوزاً فواصل `space` التي يدسّها `marked`. */
function nextReal(tokens: Tokens.Generic[], i: number): string | undefined {
  for (let k = i + 1; k < tokens.length; k++)
    if (tokens[k]!.type !== 'space') return tokens[k]!.type;
  return undefined;
}

export function splitBlocks(raw: string, sid: string): Block[] {
  const tokens = marked.lexer(raw);
  const out: Block[] = [];
  let pending: Tokens.Generic[] = [];

  /* حالةٌ يحملها التوجيه إلى البلوك الذي يليه مباشرة */
  let outNote: string | undefined;
  let isOut = false;
  let isErr = false;
  let errCode: string | undefined;
  let gateNext = false;
  let gateNote: string | undefined;

  const flush = () => {
    if (!pending.length) return;
    out.push({ type: 'md', html: pending.map(html).join('') });
    pending = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;

    if (t.type === 'html') {
      const text = (t as Tokens.HTML).text.trim();
      const o = text.match(OUT);
      if (o) { isOut = true; outNote = o[1]?.trim() || undefined; continue; }
      const e = text.match(ERR);
      if (e) { isErr = true; errCode = e[1]?.trim() || undefined; continue; }
      continue;
    }

    if (t.type === 'paragraph') {
      /* فقرةٌ نصّها «المخرَج:» وحده — بوّابة تنبّؤ على البلوك التالي */
      const g = (t.raw || '').trim().match(/^\*{0,2}المخرَج\*{0,2}(?:\s*\(([^)]*)\))?\s*:\s*$/);
      if (g && nextReal(tokens, i) === 'code') {
        gateNext = true;
        gateNote = g[1]?.trim() || undefined;
        continue;
      }
    }

    if (t.type === 'code') {
      const { text: code, lang } = t as Tokens.Code;
      flush();
      const id = `${sid}-${out.length}`;

      if (gateNext) {
        out.push({ type: 'gate', output: code, id, note: gateNote });
        gateNext = false; gateNote = undefined; isOut = false; isErr = false;
        continue;
      }
      if (isErr) {
        out.push({ type: 'err', text: code, code: errCode });
        isErr = false; errCode = undefined; isOut = false;
        continue;
      }
      if (isOut) {
        out.push({ type: 'out', text: code, note: outNote });
        isOut = false; outNote = undefined;
        continue;
      }
      if (lang === 'bash' || lang === 'sh') { out.push({ type: 'local', code }); continue; }
      if (lang === 'rust') { out.push({ type: 'code', code, lang, id }); continue; }
      out.push({ type: 'figure', text: code });
      continue;
    }

    pending.push(t);
  }

  flush();
  return out;
}

export function buildStations(sections: Section[], num: string): Station[] {
  return sections.map((s) => ({
    id: `${num}-${slugify(s.title)}`,
    title: s.title,
    blocks: splitBlocks(s.raw, `${num}-${slugify(s.title)}`),
  }));
}
