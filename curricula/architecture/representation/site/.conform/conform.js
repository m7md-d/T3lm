import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const KEYWORDS = ["box", "link"];
const PUNCT = {
  "->": "ARROW",
  "{": "LBRACE",
  "}": "RBRACE",
  ":": "COLON",
  ",": "COMMA",
  ".": "DOT"
};
class DslError extends Error {
  constructor(message, line, col, source = "") {
    super(message);
    this.message = message;
    this.line = line;
    this.col = col;
    this.source = source;
    this.name = "DslError";
  }
  message;
  line;
  col;
  source;
  report() {
    const lines = this.source.split("\n");
    const head = `سطر ${this.line}، عمود ${this.col}: ${this.message}`;
    if (!(this.line >= 1 && this.line <= lines.length)) return head;
    return [head, "    " + lines[this.line - 1], "    " + " ".repeat(this.col - 1) + "^"].join("\n");
  }
}
const DIGIT = new RegExp("\\p{Nd}", "u");
const ALPHA = new RegExp("\\p{L}", "u");
const ALNUM = /[\p{L}\p{N}]/u;
function tokenize(source) {
  const out = [];
  let line = 1, col = 1, i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\n") {
      line += 1;
      col = 1;
      i += 1;
    } else if (ch === " " || ch === "	") {
      col += 1;
      i += 1;
    } else if (ch === "#") {
      while (i < source.length && source[i] !== "\n") i += 1;
    } else if (source.startsWith("->", i)) {
      out.push({ kind: "ARROW", text: "->", line, col });
      col += 2;
      i += 2;
    } else if (ch in PUNCT) {
      out.push({ kind: PUNCT[ch], text: ch, line, col });
      col += 1;
      i += 1;
    } else if (ch === '"') {
      const j = source.indexOf('"', i + 1);
      if (j < 0) throw new DslError("سلسلةٌ بلا إغلاق", line, col, source);
      out.push({ kind: "STRING", text: source.slice(i + 1, j), line, col });
      col += j - i + 1;
      i = j + 1;
    } else if (DIGIT.test(ch)) {
      let j = i;
      while (j < source.length && DIGIT.test(source[j])) j += 1;
      out.push({ kind: "NUMBER", text: source.slice(i, j), line, col });
      col += j - i;
      i = j;
    } else if (ALPHA.test(ch) || ch === "_") {
      let j = i;
      while (j < source.length && (ALNUM.test(source[j]) || source[j] === "_")) j += 1;
      const word = source.slice(i, j);
      const kind = KEYWORDS.includes(word) ? word.toUpperCase() : "IDENT";
      out.push({ kind, text: word, line, col });
      col += j - i;
      i = j;
    } else {
      throw new DslError(`حرفٌ لا تعرفه اللغة: ${repr(ch)}`, line, col, source);
    }
  }
  out.push({ kind: "EOF", text: "", line, col });
  return out;
}
const repr = (ch) => `'${ch === "'" ? "\\'" : ch}'`;
class Parser {
  constructor(source) {
    this.source = source;
    this.tokens = tokenize(source);
  }
  source;
  tokens;
  i = 0;
  get peek() {
    return this.tokens[this.i];
  }
  eat(kind, what) {
    const token = this.peek;
    if (token.kind !== kind) {
      const found = token.text || "نهايةَ الملفّ";
      throw new DslError(`توقّعتُ ${what ?? kind} ووجدتُ «${found}»`, token.line, token.col, this.source);
    }
    this.i += 1;
    return token;
  }
  document() {
    const out = [];
    while (this.peek.kind !== "EOF") out.push(this.statement());
    return out;
  }
  statement() {
    if (this.peek.kind === "BOX") return this.box();
    if (this.peek.kind === "LINK") return this.link();
    throw new DslError(
      `توقّعتُ «box» أو «link» ووجدتُ «${this.peek.text}»`,
      this.peek.line,
      this.peek.col,
      this.source
    );
  }
  box() {
    const at = this.eat("BOX");
    const name = this.eat("IDENT", "اسمَ الصندوق");
    const label = this.eat("STRING", "وسماً بين علامتَي اقتباس");
    let props = {};
    if (this.peek.kind === "LBRACE") {
      this.eat("LBRACE");
      props = this.properties();
      this.eat("RBRACE", "«}»");
    }
    return { t: "Box", name: name.text, label: label.text, props, at };
  }
  properties() {
    const out = {};
    for (let kind = this.kind(); kind === "IDENT"; kind = this.kind()) {
      const key = this.eat("IDENT");
      this.eat("COLON", "«:»");
      out[key.text] = this.value();
      if (this.kind() === "COMMA") this.eat("COMMA");
    }
    return out;
  }
  kind() {
    return this.peek.kind;
  }
  value() {
    const token = this.peek;
    if (token.kind === "NUMBER") return toInt(this.eat("NUMBER").text);
    if (token.kind === "STRING" || token.kind === "IDENT") {
      this.i += 1;
      return token.text;
    }
    throw new DslError(`توقّعتُ قيمةً ووجدتُ «${token.text}»`, token.line, token.col, this.source);
  }
  link() {
    const at = this.eat("LINK");
    const src = this.port();
    this.eat("ARROW", "«->»");
    return { t: "Link", src, dst: this.port(), at };
  }
  port() {
    const name = this.eat("IDENT", "اسمَ صندوق");
    this.eat("DOT", "«.»");
    return { box: name.text, port: this.eat("IDENT", "اسمَ منفذ").text, at: name };
  }
}
const toInt = (s) => Number([...s].map((d) => String(d.codePointAt(0) - findZero(d))).join(""));
const findZero = (d) => {
  const c = d.codePointAt(0);
  for (const zero of [48, 1632, 1776, 2406]) if (c >= zero && c <= zero + 9) return zero;
  return 48;
};
const parse = (source) => new Parser(source).document();
const TYPES = {
  source: { out: "flow" },
  filter: { in: "flow", out: "flow" },
  sink: { in: "flow" },
  meter: { in: "signal" }
};
const DEFAULT_TYPE = "filter";
function build(source) {
  const table = /* @__PURE__ */ new Map();
  const edges = [];
  for (const node of parse(source)) {
    if (node.t !== "Box") continue;
    if (table.has(node.name)) {
      const first = table.get(node.name).at;
      throw new DslError(
        `الاسم «${node.name}» معرَّفٌ سلفاً في السطر ${first.line}`,
        node.at.line,
        node.at.col,
        source
      );
    }
    const kind = String(node.props["type"] ?? DEFAULT_TYPE);
    if (!(kind in TYPES)) {
      throw new DslError(
        `نوعٌ لا تعرفه اللغة: «${kind}» — المعروف ${Object.keys(TYPES).join(", ")}`,
        node.at.line,
        node.at.col,
        source
      );
    }
    table.set(node.name, {
      id: node.name,
      label: node.label,
      kind,
      params: node.props,
      at: node.at,
      ports: TYPES[kind]
    });
  }
  for (const node of parse(source)) {
    if (node.t !== "Link") continue;
    const ends = [];
    for (const side of [node.src, node.dst]) {
      const comp = table.get(side.box);
      if (comp === void 0) {
        const known = [...table.keys()].sort(byCode).join(", ") || "لا شيء";
        throw new DslError(
          `لا صندوقَ اسمُه «${side.box}» — المعرَّف ${known}`,
          side.at.line,
          side.at.col,
          source
        );
      }
      if (!(side.port in comp.ports)) {
        const have = Object.keys(comp.ports).join(", ") || "لا منافذ";
        throw new DslError(
          `المنفذ «${side.port}» ليس في نوع «${comp.kind}» — منافذُه ${have}`,
          side.at.line,
          side.at.col,
          source
        );
      }
      ends.push([comp, side.port]);
    }
    const [a, b] = ends;
    const [src, sport] = a;
    const [dst, dport] = b;
    if (src.ports[sport] !== dst.ports[dport]) {
      throw new DslError(
        `منفذان لا يتوافقان: ${src.id}.${sport} من نوع «${src.ports[sport]}» و${dst.id}.${dport} من نوع «${dst.ports[dport]}»`,
        node.at.line,
        node.at.col,
        source
      );
    }
    edges.push({ src, srcPort: sport, dst, dstPort: dport, at: node.at });
  }
  return { components: table, edges };
}
const byCode = (x, y) => x < y ? -1 : x > y ? 1 : 0;
function dump(diagram) {
  const lines = [];
  const comps = [...diagram.components.values()].sort((a, b) => byCode(a.id, b.id));
  for (const comp of comps) {
    const keys = Object.keys(comp.params).filter((k) => k !== "type").sort(byCode);
    const body = keys.map((k) => `${k}: ${comp.params[k]}`).join(", ");
    const tail = ` { type: ${comp.kind}` + (body ? `, ${body}` : "") + " }";
    lines.push(`box ${comp.id} "${comp.label}"${tail}`);
  }
  const key = (e) => [e.src.id, e.srcPort, e.dst.id, e.dstPort];
  const edges = [...diagram.edges].sort((a, b) => {
    const x = key(a), y = key(b);
    for (let i = 0; i < x.length; i++) {
      const c = byCode(x[i], y[i]);
      if (c) return c;
    }
    return 0;
  });
  for (const e of edges) lines.push(`link ${e.src.id}.${e.srcPort} -> ${e.dst.id}.${e.dstPort}`);
  return lines.join("\n") + "\n";
}
const ROOT = new URL("../..", import.meta.url).pathname;
const EX = join(ROOT, "examples");
const list = (dir) => readdirSync(join(EX, dir)).filter((f) => f.endsWith(".dsl")).sort().map((f) => ({ name: f, path: join(EX, dir, f) }));
let bad = 0;
const fail = (m) => {
  console.error(`✗ ${m}`);
  bad++;
};
const good = list("valid");
const canon = pythonDump(good.map((g) => g.path));
for (const g of good) {
  const src = readFileSync(g.path, "utf8");
  try {
    const got = dump(build(src));
    if (got !== canon[g.path]) {
      fail(`${g.name}: الشكل القانونيّ يخالف Python
--- Python
${canon[g.path]}--- TypeScript
${got}`);
    }
  } catch (e) {
    const r = e instanceof DslError ? e.report() : String(e);
    fail(`${g.name}: صالحٌ ورُفض
${r}`);
  }
}
const evil = list("invalid");
for (const b of evil) {
  const src = readFileSync(b.path, "utf8");
  const want = readFileSync(b.path.replace(/\.dsl$/, ".expected"), "utf8").replace(/\n+$/, "");
  let got = null;
  try {
    build(src);
  } catch (e) {
    if (!(e instanceof DslError)) {
      fail(`${b.name}: رفضٌ بلا موضع — ${String(e)}`);
      continue;
    }
    got = e.report();
  }
  if (got === null) {
    fail(`${b.name}: فاسدٌ وقُبل`);
    continue;
  }
  if (got !== want) fail(`${b.name}: نصُّ الرفض يخالف Python
--- متوقَّع
${want}
--- وقع
${got}`);
}
console.log(`نقلُ اللغة: صالحةٌ قُبلت ${good.length - bad0(bad)}/${good.length} · فاسدةٌ رُفضت بنصّها ${evil.length}/${evil.length}`);
if (bad) {
  console.error(`${bad} اختلافاً بين المتصفّح وPython — لا زرَّ تشغيل حتى تُسدّ`);
  process.exit(1);
}
console.log("✓ المتصفّح يعطي ما تعطيه Python: النصّ والسطر والعمود");
function bad0(n) {
  return n > good.length ? good.length : n;
}
function pythonDump(paths) {
  const code = [
    "import sys, json, pathlib",
    `sys.path.insert(0, ${JSON.stringify(join(ROOT, "programs"))})`,
    "from model import build",
    "from emit import dump",
    'out = {p: dump(build(pathlib.Path(p).read_text(encoding="utf-8"))) for p in sys.argv[1:]}',
    "print(json.dumps(out, ensure_ascii=False))"
  ].join("\n");
  const raw = execFileSync("python3", ["-c", code, ...paths], { encoding: "utf8" });
  return JSON.parse(raw);
}
