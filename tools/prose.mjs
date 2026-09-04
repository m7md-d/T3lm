#!/usr/bin/env node
/**
 * يفحص نثر المناهج ضدّ الحقل ١٤ في `.claude/profiles/default.md`.
 *
 *   node tools/prose.mjs                 كل المناهج
 *   node tools/prose.mjs <slug|path>     منهجٌ واحد
 *   node tools/prose.mjs --list          يطبع كل موضعٍ مخالف بسطره
 *
 * الفحص على النثر وحده: البلوكات والكود السطريّ تُنزَع قبل البحث، لأن `**` في
 * كتلة كودٍ ليست توكيداً و«لا» في مخرَجٍ ليست نفياً.
 *
 * والحدود مقيسة على مرجعٍ لا مخترَعة. المرجع `curricula/languages/python/ref/`
 * (SAFCSP zo-python101..103): ١٣٥٧٤ كلمة نثر، فيها ٣٢٫٥٦ عريضاً لكل ألف —
 * **٤٤٪ منها وسومٌ بنيوية** (`**Example**`, `**Output**`, `**Syntax**`)، فيبقى
 * التوكيد الخطابيّ ١٨٫٣. والتفضيل عنده ٠٫٧٤.
 *
 * ومناهج هذا المستودع عند كتابة الفاحص: عريضٌ خطابيّ ٣٧–٥٦، ووسمٌ بنيويّ يقارب
 * الصفر (٠–٨ من ٥٠٠–١٠٠٠). الفرق بنيويّ: المرجع يوسم، ونحن نرفع الصوت.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CURRICULA = join(ROOT, 'curricula');

/* ــ الحدود، لكل ألف كلمةٍ من النثر ــ */
const BUDGET = { negation: 1.0, superlative: 1.0, emphasis: 20.0 };

/* الوسم البنيويّ توكيدٌ مشروع: القارئ يمسح الصفحة بحثاً عنه */
const LABELS = new Set([
  'مثال', 'أمثلة', 'المخرَج', 'المخرج', 'الصيغة', 'الحالات', 'ملاحظة', 'تحذير',
  'المدخل', 'الشرط', 'التمرين', 'الخلاصة', 'النتيجة', 'القاعدة', 'المكسب',
  'الادّعاء', 'الادعاء', 'الدليل', 'الحدّ', 'الحد', 'المصدر', 'الثمن',
  'الفصل التالي', 'توقّع', 'توقع', 'المشكلة', 'الجواب',
]);

/* وسمٌ مرقَّم يفتح فقرةً متكرّرة: «القطعة الأولى — …»، «الحالة ٢ — …» */
const PREFIX = ['القطعة', 'الحزمة', 'الخطوة', 'الحالة', 'الطريقة', 'السطر'];

/* تعريفُ مصطلح: «الكائن (object)» — العربية ثم الاسم الإنجليزيّ بين قوسين */
const TERM = /^\S+(?:\s\S+)?\s\([A-Za-z][A-Za-z_\- ]*\)$/;

const structural = (inner) =>
  LABELS.has(norm(inner)) ||
  TERM.test(inner) ||
  PREFIX.some((w) => inner.startsWith(w + ' '));

const TASHKEEL = /[ً-ْٰـ]/g;
const norm = (s) => s.replace(TASHKEEL, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');

const SUPERLATIVES = [
  'اخطر', 'اهم', 'اقوي', 'اعظم', 'اصعب', 'ابشع', 'اجمل', 'اوضح', 'ادق', 'اسرع',
  'الوحيد', 'الوحيدة', 'بلا استثناء', 'ابدا', 'تماما', 'حرفيا', 'علي الاطلاق',
];
const HYPE = ['اسطوري', 'رهيب', 'مذهل', 'مدهش', 'خرافي', 'عبقري', 'لا يصدق', 'سيغضبك', 'ستندهش'];

/**
 * نثرٌ صافٍ: بلا كتلٍ، ولا كودٍ سطريّ، ولا تعليقات العلامات، ولا جداول.
 *
 * **وأرقامُ الأسطر تُحفَظ**: الكتلة تُستبدَل بأسطرٍ فارغةٍ بعددها، لا بسطرٍ
 * واحد — وإلّا أشار التقرير إلى سطرٍ ليس هو.
 */
function prose(src) {
  return src
    .replace(/^```[\s\S]*?^```/gm, (m) => '\n'.repeat(m.split('\n').length - 1))
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^\|.*\|$/gm, ' ')
    .replace(/^\s*>.*$/gm, (m) => m.replace(/^\s*>\s?/, ''));
}

/**
 * أقسامٌ بلا دليلٍ ولا مكسب — النمط الذي لا يراه عدُّ الكلمات ولا عدُّ التوكيد:
 * قسمٌ قصيرٌ بلا كتلةٍ واحدة، وأكثرُه إحالةٌ إلى فصلٍ آخر. كُشِف أوّلَ مرّةٍ
 * بلقطة متصفّح لا بأداة، فصار أداة.
 */
function thinSections(src) {
  const lines = src.split('\n');
  /* الأقسام أوّلاً بمداها، ثم تُحكَم — لأن الحكم يحتاج ما بعد العنوان. */
  const secs = [];
  let fence = false;
  lines.forEach((ln, i) => {
    if (/^```/.test(ln)) { fence = !fence; return; }
    if (fence) return;
    const m = /^(#{2,3})\s+(.*)$/.exec(ln);
    if (m) secs.push({ depth: m[1].length, head: m[2].trim(), at: i, end: lines.length });
  });
  secs.forEach((sec, k) => { if (secs[k + 1]) sec.end = secs[k + 1].at; });

  const out = [];
  for (const [k, sec] of secs.entries()) {
    /* `## ` له أبناء `### ` ترويسةُ جزءٍ لا قسم: محتواه في أبنائه. */
    if (sec.depth === 2 && secs[k + 1]?.depth === 3) continue;
    /* التمرين يسأل ولا يدّعي، فلا يلزمه دليل. ويبقى حدُّ الطول عليه. */
    const isTask = /^(تمرين|التمرين)\b/.test(sec.head);

    let words = 0, blocks = 0, refs = 0, rows = 0;
    let f = false;
    for (let i = sec.at + 1; i < sec.end; i++) {
      const ln = lines[i];
      if (/^```/.test(ln)) { f = !f; if (f) blocks++; continue; }
      if (f) continue;
      /* الجدول دليلٌ كالكتلة: صفوفه بيانات، لا نثر. */
      if (/^\s*\|/.test(ln)) { rows++; continue; }
      words += (ln.replace(/`[^`\n]*`/g, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
      refs += (ln.match(/(?:الفصل|الإقليم)\s+`\d\d`/g) || []).length;
    }
    /* الحدّ ٤٥ كلمة: أقصرُ قسمٍ سليمٍ في المرجع ٥٢ كلمة. */
    const thinClaim = blocks === 0 && rows < 3 && words < 45;
    const thinTask = isTask && words < 35;
    if (isTask ? thinTask : thinClaim) {
      out.push({ head: sec.head, line: sec.at + 1, words, refs });
    }
  }
  return out;
}

/** «س، لا ص» و«ليس س بل ص» — النفي الذي يصحّ النصّ بحذف نصفه الأوّل. */
function negations(text) {
  const hits = [];
  const push = (re) => {
    for (const m of text.matchAll(re)) hits.push({ index: m.index, text: m[0].trim() });
  };
  push(/[^\s،][،]\s*لا\s+[^\s.،]+/g);
  push(/\bليس(?:ت|وا)?\b[^.،؛\n]{1,60}?\bبل\b/g);
  push(/\bوليس(?:ت|وا)?\b[^.،؛\n]{1,60}?\bبل\b/g);
  return hits;
}

function words(text) {
  return (text.match(/[\p{L}\p{N}]+/gu) || []).length;
}

/** موضع الفهرس ⇒ رقم السطر في الملفّ الأصليّ (النثر يحفظ الأسطر). */
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

function scanFile(path) {
  const src = readFileSync(path, 'utf8');
  const text = prose(src);
  const flat = norm(text);
  const w = words(text);

  const neg = negations(text);

  const sup = [];
  for (const term of [...SUPERLATIVES, ...HYPE]) {
    const re = new RegExp(`(?<![\\p{L}])${term}(?![\\p{L}])`, 'gu');
    for (const m of flat.matchAll(re)) {
      sup.push({ index: m.index, text: term, hype: HYPE.includes(term) });
    }
  }

  const thin = thinSections(src);

  const bold = [];
  for (const m of text.matchAll(/\*\*([^*\n]+)\*\*/g)) {
    const inner = m[1].replace(/[:：\s]+$/, '').trim();
    bold.push({ index: m.index, text: inner, label: structural(inner) });
  }

  return { path, words: w, neg, sup, bold, thin };
}

function collect(dir) {
  const out = [];
  for (const sub of ['regions', 'appendix']) {
    const d = join(dir, sub);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((f) => f.endsWith('.md')).sort()) out.push(join(d, f));
  }
  return out;
}

function curricula(filter) {
  const out = [];
  for (const cat of readdirSync(CURRICULA)) {
    const catDir = join(CURRICULA, cat);
    if (!statSync(catDir).isDirectory()) continue;
    for (const slug of readdirSync(catDir)) {
      const dir = join(catDir, slug);
      if (!statSync(dir).isDirectory()) continue;
      if (!existsSync(join(dir, 'regions'))) continue;
      if (filter && slug !== filter && !dir.endsWith(filter)) continue;
      out.push({ slug, cat, dir });
    }
  }
  return out;
}

const args = process.argv.slice(2);
const list = args.includes('--list');
const filter = args.find((a) => !a.startsWith('--'));

const per1k = (n, w) => (w ? (n * 1000) / w : 0);
const fmt = (n) => n.toFixed(2).padStart(5);

let failed = 0;
const targets = curricula(filter);
if (!targets.length) {
  console.error(filter ? `لا منهج بهذا الاسم: ${filter}` : 'لا مناهج');
  process.exit(1);
}

for (const { slug, dir } of targets) {
  const files = collect(dir).map(scanFile);
  const w = files.reduce((a, f) => a + f.words, 0);
  const neg = files.flatMap((f) => f.neg.map((h) => ({ ...h, f })));
  const sup = files.flatMap((f) => f.sup.map((h) => ({ ...h, f })));
  const bold = files.flatMap((f) => f.bold.map((h) => ({ ...h, f })));
  const emph = bold.filter((b) => !b.label);
  const thin = files.flatMap((f) => f.thin.map((t) => ({ ...t, f })));
  const hype = sup.filter((s) => s.hype);

  const rates = {
    negation: per1k(neg.length, w),
    superlative: per1k(sup.length, w),
    emphasis: per1k(emph.length, w),
  };
  const over = Object.entries(BUDGET).filter(([k, v]) => rates[k] > v).map(([k]) => k);
  const bad = over.length || hype.length || thin.length;
  if (bad) failed++;

  const mark = bad ? '✗' : '✓';
  console.log(
    `${mark} ${slug.padEnd(16)} ${String(w).padStart(6)} كلمة  ` +
      `نفي ${fmt(rates.negation)}  تفضيل ${fmt(rates.superlative)}  ` +
      `توكيد ${fmt(rates.emphasis)} (وسم ${bold.length - emph.length}/${bold.length})` +
      (over.length ? `   ← تجاوز: ${over.join('، ')}` : '') +
      (hype.length ? `   ← مبالغة: ${hype.length}` : '') +
      (thin.length ? `   ← أقسامٌ بلا دليل: ${thin.length}` : ''),
  );

  if (list && bad) {
    const show = (hits, tag) => {
      for (const h of hits.slice(0, 40)) {
        const src = readFileSync(h.f.path, 'utf8');
        const line = lineOf(prose(src), h.index);
        console.log(`    ${tag} ${relative(ROOT, h.f.path)}:${line}  ${h.text}`);
      }
      if (hits.length > 40) console.log(`    … و${hits.length - 40} غيرها`);
    };
    if (over.includes('negation')) show(neg, 'نفي   ');
    if (over.includes('superlative') || hype.length) show(sup, 'تفضيل ');
    if (over.includes('emphasis')) show(emph, 'توكيد ');
    for (const t of thin.slice(0, 40)) {
      console.log(
        `    قسم   ${relative(ROOT, t.f.path)}:${t.line}  «${t.head}» — ` +
          `${t.words} كلمة، بلا كتلة${t.refs ? `، و${t.refs} إحالة` : ''}`,
      );
    }
  }
}

console.log();
console.log(
  `الحدود لكل ألف كلمة نثر: نفي ≤ ${BUDGET.negation.toFixed(1)} · ` +
    `تفضيل ≤ ${BUDGET.superlative.toFixed(1)} · توكيدٌ خطابيّ ≤ ${BUDGET.emphasis.toFixed(0)}` +
    `   (المرجع: تفضيل ٠٫٧٤ · توكيد ١٨٫٣)`,
);
console.log(failed ? `✗ ${failed} من ${targets.length} خارج الحدّ` : `✓ ${targets.length} داخل الحدّ`);
process.exit(failed ? 1 : 0);
