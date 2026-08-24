/**
 * تقسيم اللقطة إلى بلوكات — **مفردات هذا المنهج**، لا مفرداتٍ عامّة.
 *
 * وهي خمس: نثرٌ، وهيكلٌ (`layout`)، ولوحةُ تقرير، وبوّابةُ تنبّؤ، وسطرُ أمر.
 * والعلامة تُقرأ من الماركداون ولا تُعلَن هنا: كتلةُ `layout` هيكل، والكتلة
 * التي يسبقها `<!-- out -->` أو `المخرَج:` لوحة.
 */
import { marked, type Tokens } from 'marked';
import type { Section } from '@t3lm/kit/md';
import { slugify } from '@t3lm/kit/md';
import { parseLayout, type Layout } from './layout';

export type Block =
  | { type: 'md'; html: string }
  | { type: 'layout'; layout: Layout }
  | { type: 'report'; text: string; note?: string }
  | { type: 'gate'; text: string; id: string }
  | { type: 'cmd'; code: string }
  | { type: 'figure'; text: string };

export interface Shot {
  title: string;
  id: string;
  blocks: Block[];
}

const OUT = /^<!--\s*out(?::\s*([\s\S]*?))?\s*-->\s*$/;
const GATE = /^\*{0,2}المخرَج\*{0,2}\s*:\s*$/;

/**
 * الاقتباس هنا نوعان: **نصٌّ مصدريّ إنجليزيّ** (١١ منها من `Parnas` و`Cockburn`
 * وغيرهما) وملاحظةٌ عربية. والأوّل يحتاج اتّجاهاً صريحاً وإلا قفزت نقطته إلى
 * أوّل السطر، والثاني لا. **فيُقرَّر من النصّ لا من مكانه.**
 */
function html(t: Tokens.Generic): string {
  const out = marked.parser([t as Tokens.Generic] as never);
  if (t.type !== 'blockquote') return out;
  const arabic = /[\u0600-\u06FF]/.test((t as Tokens.Blockquote).text ?? '');
  return arabic ? out : out.replace('<blockquote>', '<blockquote dir="ltr" class="src">');
}

/** نوعُ أوّل بلوكٍ حقيقيّ بعد الموضع — متجاوزاً فواصل `space`. */
function nextReal(tokens: Tokens.Generic[], i: number): string | undefined {
  for (let k = i + 1; k < tokens.length; k++)
    if (tokens[k]!.type !== 'space') return tokens[k]!.type;
  return undefined;
}

export function toBlocks(raw: string, sid: string): Block[] {
  const tokens = marked.lexer(raw);
  const out: Block[] = [];
  let pending: Tokens.Generic[] = [];
  let isOut = false;
  let note: string | undefined;
  let isGate = false;

  const flush = () => {
    if (!pending.length) return;
    out.push({ type: 'md', html: pending.map(html).join('') });
    pending = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;

    if (t.type === 'html') {
      const m = (t as Tokens.HTML).text.trim().match(OUT);
      if (m) { isOut = true; note = m[1]?.trim() || undefined; }
      continue;   // كل تعليقٍ يُسقَط — `shell` و`part` علاماتُ فحصٍ لا عرض
    }

    /* `marked` يدسّ `space` بين البلوكات — فالنظر إلى ما بعدها لا إلى ما يليها */
    if (t.type === 'paragraph' && GATE.test((t.raw || '').trim()) && nextReal(tokens, i) === 'code') {
      isGate = true;
      continue;
    }

    if (t.type === 'code') {
      const { lang, text } = t as Tokens.Code;
      flush();
      if (lang === 'layout') { out.push({ type: 'layout', layout: parseLayout(text) }); continue; }
      if (isGate) { out.push({ type: 'gate', text, id: `${sid}-${out.length}` }); isGate = false; isOut = false; continue; }
      if (isOut) { out.push({ type: 'report', text, note }); isOut = false; note = undefined; continue; }
      if (lang === 'bash' || lang === 'sh') { out.push({ type: 'cmd', code: text }); continue; }
      out.push({ type: 'figure', text });
      continue;
    }

    pending.push(t as Tokens.Generic);
  }
  flush();
  return out;
}

export const buildShots = (sections: Section[], num: string): Shot[] =>
  sections.map((s, i) => ({
    title: s.title,
    id: slugify(`${num}-${i}-${s.title}`),
    blocks: toBlocks(s.raw, `${num}-${i}`),
  }));
