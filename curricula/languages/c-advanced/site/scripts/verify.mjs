#!/usr/bin/env node
/**
 * فحص المحتوى — يقرأ `regions/` و`README.md` و`programs/` مباشرةً، ويفشل
 * بالملفّ والسطر. ما يقرؤه `tools/verify.py` يقرؤه هذا، فلا ينحرف العرض عن
 * ما يُتحقَّق منه.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CUR = path.resolve(HERE, '..', '..');
const REG = path.join(CUR, 'regions');
const PROG = path.join(CUR, 'programs');
const SRC = path.resolve(HERE, '..', 'src');

let bad = 0;
const err = (m) => { console.error(`  ✗ ${m}`); bad++; };
const say = (m) => console.log(`  · ${m}`);

/* ── العلامات، بنفس صيغتها في الفاحص ── */
const AUTHS = ['spec', 'posix', 'abi', 'os', 'impl', 'unspec', 'machine', 'env', 'ub'];
const PANEL = /^<!--\s*(out|gate|err|warn)(?:\s*@(\w+))?(?::\s*(.*?))?\s*-->$/;
const SHELL = /^<!--\s*shell\s*-->$/;
const BIND = /^<!--\s*(part|runs)(?:\s*@\w+)?(?::\s*([\w./-]+))?\s*-->$/;
const PREDICT = /^\*{0,2}توقّع/;

const files = fs.readdirSync(REG).filter((f) => f.endsWith('.md')).sort();
const nums = files.map((f) => f.slice(0, 2));

/* ── أ) جدول README مقابل ما في regions/ ── */
const readme = fs.readFileSync(path.join(CUR, 'README.md'), 'utf8');
const planned = [...readme.matchAll(/^\|\s*`(\d\d)`\s*\|/gm)].map((m) => m[1]);
const missing = planned.filter((n) => !nums.includes(n));
const extra = nums.filter((n) => !planned.includes(n));
if (missing.length) err(`فصولٌ في جدول README بلا ملفّ: ${missing.join(' ')}`);
if (extra.length) err(`ملفّاتٌ في regions/ بلا صفٍّ في جدول README: ${extra.join(' ')}`);
say(`${nums.length} فصلاً، وجدولُ README يطابقها`);

/* ── ب) اللوحات: وسمٌ معروف، وسياجٌ بعدها، وبرنامجٌ موجود ── */
const grades = { exact: 0, semantic: 0, manual: 0, reject: 0, warn: 0 };
const fams = { spec: 0, sys: 0, tool: 0, hw: 0, none: 0 };
let panels = 0, untagged = 0, gates = 0;
const SYSTEM_IMPL = /glibc|ld\.so|pthread|libc/;

for (const f of files) {
  const num = f.slice(0, 2);
  const lines = fs.readFileSync(path.join(REG, f), 'utf8').split('\n');
  let bind = null, lastBind = null, lastCodeAt = -1, chGates = 0;

  const nextFence = (i) => {
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    return lines[j] !== undefined && lines[j].startsWith('```') ? j : -1;
  };
  /* آخر فقرةٍ غير فارغة قبل السطر i */
  const paraBefore = (i) => {
    const buf = [];
    for (let j = i - 1; j >= 0; j--) {
      const t = lines[j].trim();
      if (t.startsWith('```')) break;
      if (t === '' && buf.length) break;
      if (t === '') continue;
      if (/^\*\*(المخرَج|البرنامج)\*\*:?$/.test(t) || /^\*\*المخرَج:\*\*$/.test(t)) continue;
      if (t.startsWith('<!--')) continue;
      buf.unshift(t);
    }
    return buf.join('\n');
  };

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();

    const b = BIND.exec(t);
    if (b) {
      bind = { kind: b[1], name: b[2] };
      lastBind = bind;
      if (b[2]) {
        const dir = path.join(PROG, b[2]);
        const one = path.join(PROG, `${b[2]}.c`);
        if (!fs.existsSync(dir) && !fs.existsSync(one)) err(`${f}:${i + 1} لا برنامج programs/${b[2]}`);
      }
      continue;
    }

    if (SHELL.test(t)) {
      if (nextFence(i) < 0) { err(`${f}:${i + 1} لوحةٌ يدويةٌ بلا سياج`); continue; }
      panels++; untagged++; grades.manual++;
      bind = null;
      continue;
    }

    if (t.startsWith('```c')) lastCodeAt = i;

    const p = PANEL.exec(t);
    if (!p) {
      if (/^<!--\s*\w+\s*@/.test(t) && !BIND.test(t)) err(`${f}:${i + 1} تعليقٌ موسومٌ لا يطابق أي علامة: ${t}`);
      continue;
    }
    if (nextFence(i) < 0) { err(`${f}:${i + 1} لوحةٌ بلا سياجٍ بعدها`); continue; }

    const tag = p[2] ?? 'spec';
    if (!AUTHS.includes(tag)) { err(`${f}:${i + 1} سلطةٌ مجهولة: @${tag}`); continue; }
    const note = (p[3] ?? '').trim();

    panels++;
    const role = p[1];
    const eff = bind ?? lastBind;
    grades[role === 'err' ? 'reject' : role === 'warn' ? 'warn' : eff?.kind === 'runs' ? 'semantic' : 'exact']++;
    const fam = tag === 'impl' ? (SYSTEM_IMPL.test(note) ? 'sys' : 'tool')
      : ['spec', 'posix', 'abi'].includes(tag) ? 'spec'
      : ['os', 'env'].includes(tag) ? 'sys'
      : tag === 'unspec' ? 'tool'
      : tag === 'machine' ? 'hw' : 'none';
    fams[fam]++;

    /* السؤال إمّا بين البرنامج ومخرَجه، وإمّا قبل البرنامج — وكلاهما يقع */
    const ask = PREDICT.test(paraBefore(i).split('\n')[0] ?? '')
      || (lastCodeAt > 0 && PREDICT.test(paraBefore(lastCodeAt).split('\n')[0] ?? ''));
    if (ask) { gates++; chGates++; }
    if (role === 'gate' && !ask) err(`${f}:${i + 1} بوّابةٌ بلا سؤالٍ في المتن — ولا يُخترَع لها نصّ`);
    bind = null;
  }

  if (chGates > 3) err(`${f} فيه ${chGates} بوّابات — والحدّ ثلاث`);
}

if (untagged !== 1) err(`اللوحات بلا مصدرٍ موسوم: ${untagged} — والمُعلَن واحدةٌ يدوية`);

say(`${panels} لوحة — ${grades.exact} تُقارَن نصّاً · ${grades.semantic} تصريحات · ${grades.manual} يدوية · ${grades.reject} رفضاً · ${grades.warn} تحذيراً`);
say(`الجهات — المواصفة ${fams.spec} · النظام ${fams.sys} · الأدوات ${fams.tool} · العتاد ${fams.hw} · بلا ضمان ${fams.none}`);
say(`${gates} بوّابةَ توقّع`);

/* ── ج) ثنائية اللغة في المصدر ── */
const tsx = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name)) tsx.push(p);
  }
})(SRC);

for (const p of tsx) {
  const rel = path.relative(SRC, p);
  fs.readFileSync(p, 'utf8').split('\n').forEach((ln, i) => {
    if (/^\s*(\*|\/\/)/.test(ln)) return;
    if (/<text\b/.test(ln) && !/textAnchor=/.test(ln)) err(`src/${rel}:${i + 1} <text> بلا textAnchor — unicode-bidi لا يعمل داخل svg`);
    const m = /className="[^"]*\ben\b[^"]*"[^>]*>\s*\{?\s*["']?([^<>{}"']*)/.exec(ln);
    if (m && /[؀-ۿ]/.test(m[1])) err(`src/${rel}:${i + 1} نصٌّ عربيّ داخل .en — الأحاديّ يفكّ وصل الحروف`);
  });
}

const css = fs.readFileSync(path.join(SRC, 'styles/components.css'), 'utf8')
  + fs.readFileSync(path.join(SRC, 'styles/base.css'), 'utf8')
  + fs.readFileSync(path.join(SRC, 'styles/layout.css'), 'utf8');
if (/letter-spacing/.test(css.replace(/letter-spacing:\s*0;/g, ''))) err('letter-spacing في الأنماط — لا يصحب العربية');

/* ── د) لا لونَ حرفيّ خارج التوكنز (نفس قاعدة doctor، مبكّراً) ── */
for (const p of [...tsx, path.join(SRC, 'styles/components.css'), path.join(SRC, 'styles/base.css'), path.join(SRC, 'styles/layout.css')]) {
  fs.readFileSync(p, 'utf8').split('\n').forEach((ln, i) => {
    if (/(?<![\w-])(#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\()/.test(ln) && !/color-mix\(/.test(ln))
      err(`${path.relative(SRC, p)}:${i + 1} لون حرفيّ خارج tokens.css`);
  });
}

console.log(bad ? `\n✗ ${bad} مخالفة` : '\n✓ المحتوى والمصدر متطابقان');
process.exit(bad ? 1 : 0);
