/**
 * منقولٌ حرفياً عن `../../programs/dsl.py` — المقطِّع والمحلّل ورسالةُ الرفض.
 *
 * **وليس نسخةً ثانية من اللغة.** `scripts/conform.ts` يشغّل هذا الملفّ على
 * `examples/valid/` و`examples/invalid/` ويقارن **نصّ الرفض وموضعَه** بما
 * سجّلته Python في `.expected`، ويفشل البناء عند أوّل حرفٍ يختلف. فما يراه
 * القارئ في المتصفّح هو ما يعطيه `python3 tools/examples.py` بعينه.
 *
 * والقواعدُ في `../../programs/grammar.ebnf`: لكلّ قاعدةٍ دالّةٌ باسمها هنا.
 */

export const KEYWORDS = ['box', 'link'] as const;

export const PUNCT: Record<string, string> = {
  '->': 'ARROW', '{': 'LBRACE', '}': 'RBRACE',
  ':': 'COLON', ',': 'COMMA', '.': 'DOT',
};

export type Token = { kind: string; text: string; line: number; col: number };

/** رفضٌ بموضع. وبلا موضعٍ ليس رفضاً — انظر الفصل ٠٩. */
export class DslError extends Error {
  constructor(
    readonly message: string,
    readonly line: number,
    readonly col: number,
    readonly source = ''
  ) {
    super(message);
    this.name = 'DslError';
  }

  report(): string {
    const lines = this.source.split('\n');
    const head = `سطر ${this.line}، عمود ${this.col}: ${this.message}`;
    if (!(this.line >= 1 && this.line <= lines.length)) return head;
    return [head, '    ' + lines[this.line - 1], '    ' + ' '.repeat(this.col - 1) + '^'].join('\n');
  }
}

/* `str.isdigit` و`str.isalpha` في Python يونيكوديّان — والنقلُ يتبعهما، وإلّا
   قَبِل أحدُ الطرفين معرِّفاً عربياً ورفضه الآخر. */
const DIGIT = /\p{Nd}/u;
const ALPHA = /\p{L}/u;
const ALNUM = /[\p{L}\p{N}]/u;

/** النصّ إلى رموز، ولكلّ رمزٍ سطرُه وعمودُه. */
export function tokenize(source: string): Token[] {
  const out: Token[] = [];
  let line = 1, col = 1, i = 0;
  while (i < source.length) {
    const ch = source[i]!;
    if (ch === '\n') { line += 1; col = 1; i += 1; }
    else if (ch === ' ' || ch === '\t') { col += 1; i += 1; }
    else if (ch === '#') { while (i < source.length && source[i] !== '\n') i += 1; }
    else if (source.startsWith('->', i)) {
      out.push({ kind: 'ARROW', text: '->', line, col });
      col += 2; i += 2;
    } else if (ch in PUNCT) {
      out.push({ kind: PUNCT[ch]!, text: ch, line, col });
      col += 1; i += 1;
    } else if (ch === '"') {
      const j = source.indexOf('"', i + 1);
      if (j < 0) throw new DslError('سلسلةٌ بلا إغلاق', line, col, source);
      out.push({ kind: 'STRING', text: source.slice(i + 1, j), line, col });
      col += j - i + 1; i = j + 1;
    } else if (DIGIT.test(ch)) {
      let j = i;
      while (j < source.length && DIGIT.test(source[j]!)) j += 1;
      out.push({ kind: 'NUMBER', text: source.slice(i, j), line, col });
      col += j - i; i = j;
    } else if (ALPHA.test(ch) || ch === '_') {
      let j = i;
      while (j < source.length && (ALNUM.test(source[j]!) || source[j] === '_')) j += 1;
      const word = source.slice(i, j);
      const kind = (KEYWORDS as readonly string[]).includes(word) ? word.toUpperCase() : 'IDENT';
      out.push({ kind, text: word, line, col });
      col += j - i; i = j;
    } else {
      throw new DslError(`حرفٌ لا تعرفه اللغة: ${repr(ch)}`, line, col, source);
    }
  }
  out.push({ kind: 'EOF', text: '', line, col });
  return out;
}

/** `repr` لمحرفٍ واحد كما تكتبه Python: علامتا اقتباس مفردتان. */
const repr = (ch: string) => `'${ch === "'" ? "\\'" : ch}'`;

export type Port = { box: string; port: string; at: Token };
export type Box = { t: 'Box'; name: string; label: string; props: Record<string, string | number>; at: Token };
export type Link = { t: 'Link'; src: Port; dst: Port; at: Token };
export type Node = Box | Link;

/** نزولٌ عوديّ بنظرةٍ واحدة إلى الأمام. */
export class Parser {
  private tokens: Token[];
  private i = 0;
  constructor(private source: string) { this.tokens = tokenize(source); }

  get peek(): Token { return this.tokens[this.i]!; }

  private eat(kind: string, what?: string): Token {
    const token = this.peek;
    if (token.kind !== kind) {
      const found = token.text || 'نهايةَ الملفّ';
      throw new DslError(`توقّعتُ ${what ?? kind} ووجدتُ «${found}»`, token.line, token.col, this.source);
    }
    this.i += 1;
    return token;
  }

  document(): Node[] {
    const out: Node[] = [];
    while (this.peek.kind !== 'EOF') out.push(this.statement());
    return out;
  }

  statement(): Node {
    if (this.peek.kind === 'BOX') return this.box();
    if (this.peek.kind === 'LINK') return this.link();
    throw new DslError(`توقّعتُ «box» أو «link» ووجدتُ «${this.peek.text}»`,
      this.peek.line, this.peek.col, this.source);
  }

  private box(): Box {
    const at = this.eat('BOX');
    const name = this.eat('IDENT', 'اسمَ الصندوق');
    const label = this.eat('STRING', 'وسماً بين علامتَي اقتباس');
    let props: Record<string, string | number> = {};
    if (this.peek.kind === 'LBRACE') {
      this.eat('LBRACE');
      props = this.properties();
      this.eat('RBRACE', '«}»');
    }
    return { t: 'Box', name: name.text, label: label.text, props, at };
  }

  private properties(): Record<string, string | number> {
    const out: Record<string, string | number> = {};
    /* `peek` جالبٌ يتغيّر مع التقدّم، فيُقرأ في متغيّرٍ كلَّ دورة. */
    for (let kind = this.kind(); kind === 'IDENT'; kind = this.kind()) {
      const key = this.eat('IDENT');
      this.eat('COLON', '«:»');
      out[key.text] = this.value();
      if (this.kind() === 'COMMA') this.eat('COMMA');
    }
    return out;
  }

  private kind(): string { return this.peek.kind; }

  private value(): string | number {
    const token = this.peek;
    if (token.kind === 'NUMBER') return toInt(this.eat('NUMBER').text);
    if (token.kind === 'STRING' || token.kind === 'IDENT') { this.i += 1; return token.text; }
    throw new DslError(`توقّعتُ قيمةً ووجدتُ «${token.text}»`, token.line, token.col, this.source);
  }

  private link(): Link {
    const at = this.eat('LINK');
    const src = this.port();
    this.eat('ARROW', '«->»');
    return { t: 'Link', src, dst: this.port(), at };
  }

  private port(): Port {
    const name = this.eat('IDENT', 'اسمَ صندوق');
    this.eat('DOT', '«.»');
    return { box: name.text, port: this.eat('IDENT', 'اسمَ منفذ').text, at: name };
  }
}

/** `int()` في Python يقرأ أرقام يونيكود كلَّها، فتُردّ إلى اللاتينية أوّلاً. */
const toInt = (s: string): number =>
  Number([...s].map((d) => String(d.codePointAt(0)! - findZero(d))).join(''));
const findZero = (d: string): number => {
  const c = d.codePointAt(0)!;
  for (const zero of [0x30, 0x660, 0x6f0, 0x966]) if (c >= zero && c <= zero + 9) return zero;
  return 0x30;
};

export const parse = (source: string): Node[] => new Parser(source).document();
