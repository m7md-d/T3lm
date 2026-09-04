/**
 * التلوين — **ولونُ الرمز لون من يضمنه.**
 *
 * المنهج يصنّف مصادر الضمان أربعةً (`@grammar` · `@validator` · `@solver` ·
 * `@convention`، الفصل `00`)، فتأخذ رموزُ الكتلة ألوانَ تلك الجهات:
 *
 *   `سطر N، عمود M` والمؤشّر `^`   ⇒ القواعد: الموضع يولد في المقطِّع (`06`)
 *   `@grammar` … `@convention`      ⇒ كلٌّ بلونه حيث وردت في النصّ
 *   أثرُ مكدّس Python و`KeyError`   ⇒ العُرف: لا شيء في الكود ضمنه (`00`)
 *   الأعداد                         ⇒ أرقامٌ جدوليّة، بلا عائلة
 *
 * والـDSL يُلوَّن **بمقطِّع المنهج نفسه** (`./dsl.ts`) لا بتعبيرٍ نمطيّ مرتجَل:
 * ما يقسّم النصَّ في الشرح هو ما يقسّمه في الشاشة.
 */
import { tokenize } from './dsl';
import type { Token } from './dsl';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const span = (cls: string, s: string) => `<span class="${cls}">${esc(s)}</span>`;

/* ــ كتلةُ مخرَجٍ أو مصدر ــ */

const AT = /@(grammar|validator|solver|convention)\b/g;
const POS = /^(سطر \d+، عمود \d+)(:)/;
const CARET = /^(\s*)(\^+)\s*$/;
const TRACE = /^(\s*(?:File ".*|Traceback .*|\s*~*\^+\s*)|[A-Za-z_]*Error: .*|[A-Za-z_]*Warning: .*)$/;
const NUM = /(?<![\w.])(\d+(?:\.\d+)?)(?![\w.])/g;

/** يلوّن سطراً سطراً: كلُّ قاعدةٍ تصف صنفاً من الرموز يملكه ضامنٌ بعينه. */
export function lexPanel(text: string): string {
  return text.split('\n').map((line) => {
    const caret = CARET.exec(line);
    if (caret) return caret[1] + span('g-grammar', caret[2]!);

    if (TRACE.test(line)) return span('g-convention', line);

    const pos = POS.exec(line);
    let head = '';
    let rest = line;
    if (pos) {
      head = span('g-grammar', pos[1]!) + esc(pos[2]!);
      rest = line.slice(pos[0].length);
    }

    /* الباقي: العلامات `@x` ثم الأعداد، وما بينهما نصٌّ مهرَّب. */
    let out = '';
    let last = 0;
    for (const m of rest.matchAll(AT)) {
      out += numbers(rest.slice(last, m.index));
      out += span(`g-${m[1]}`, m[0]);
      last = m.index + m[0].length;
    }
    out += numbers(rest.slice(last));
    return head + out;
  }).join('\n');
}

const numbers = (s: string) => {
  let out = '';
  let last = 0;
  for (const m of s.matchAll(NUM)) {
    out += esc(s.slice(last, m.index));
    out += span('num', m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(s.slice(last));
};

/* ــ لغةُ المخطّطات ــ */

const KIND: Record<string, string> = {
  BOX: 'tok-keyword', LINK: 'tok-keyword',
  STRING: 'tok-string', NUMBER: 'tok-number', IDENT: 'tok-variableName',
  ARROW: 'tok-operator', DOT: 'tok-punctuation', COLON: 'tok-punctuation',
  COMMA: 'tok-punctuation', LBRACE: 'tok-punctuation', RBRACE: 'tok-punctuation',
};

const width = (t: Token) =>
  t.kind === 'STRING' ? t.text.length + 2 : t.kind === 'ARROW' ? 2 : t.text.length;

/** يبني جدول إزاحاتٍ لأوائل السطور، فيصير (سطر، عمود) موضعاً في النصّ. */
function offsets(source: string): number[] {
  const at = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') at.push(i + 1);
  return at;
}

/**
 * تلوين مصدر DSL بمقطِّع المنهج. وما بين الرموز مسافاتٌ أو تعليق، والتعليق
 * يبدأ بـ`#` إلى آخر السطر — كما يُلقيه المقطِّع تماماً (`06`).
 */
export function lexDsl(source: string): string {
  let tokens: Token[];
  try {
    tokens = tokenize(source);
  } catch {
    return esc(source);
  }
  const lineAt = offsets(source);
  let out = '';
  let cursor = 0;
  for (const t of tokens) {
    if (t.kind === 'EOF') break;
    const start = (lineAt[t.line - 1] ?? 0) + t.col - 1;
    out += gap(source.slice(cursor, start));
    out += span(KIND[t.kind] ?? 'tok-variableName', source.slice(start, start + width(t)));
    cursor = start + width(t);
  }
  return out + gap(source.slice(cursor));
}

const gap = (s: string) =>
  s.split('\n').map((part) => {
    const h = part.indexOf('#');
    return h < 0 ? esc(part) : esc(part.slice(0, h)) + span('tok-comment', part.slice(h));
  }).join('\n');

/* ــ EBNF ــ */

/**
 * تدوينُ القواعد كما يصفه الفصل `05` نفسه: يسارُ `=` اسمُ قاعدة، والحرفيّةُ بين
 * علامتَي اقتباس، والطرفيّ الذي يُنتجه المقطِّع بحروفٍ كبيرة، والتعليق `(* *)`.
 */
export function lexEbnf(source: string): string {
  const lines = source.split('\n');
  let comment = false;
  return lines.map((line) => {
    if (comment) {
      const end = line.indexOf('*)');
      if (end < 0) return span('tok-comment', line);
      comment = false;
      return span('tok-comment', line.slice(0, end + 2)) + rule(line.slice(end + 2));
    }
    const open = line.indexOf('(*');
    if (open >= 0) {
      const end = line.indexOf('*)', open);
      if (end < 0) { comment = true; return rule(line.slice(0, open)) + span('tok-comment', line.slice(open)); }
      return rule(line.slice(0, open)) + span('tok-comment', line.slice(open, end + 2)) + rule(line.slice(end + 2));
    }
    return rule(line);
  }).join('\n');
}

function rule(line: string): string {
  const eq = line.indexOf('=');
  const head = eq > 0 ? span('tok-definition', line.slice(0, eq)) + esc('=') : '';
  const body = eq > 0 ? line.slice(eq + 1) : line;
  return head + body.replace(/("[^"]*")|(\b[A-Z][A-Z_]*\b)|([|,;{}[\]()])/g,
    (m, str, term, punct) =>
      str ? span('tok-string', m) :
      term ? span('tok-typeName', m) :
      punct ? span('tok-punctuation', m) : esc(m));
}
