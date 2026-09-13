#!/usr/bin/env node
/**
 * فحص المحتوى — يقرأ `regions/` و`appendix/` و`README.md` و`programs/`
 * مباشرةً، ويفشل بالملفّ والسطر.
 *
 * وما يقرؤه `tools/verify.py` يقرؤه هذا بنفس الصيغة، فلا ينحرف العرض عمّا
 * يُتحقَّق منه.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CUR = path.resolve(HERE, '..', '..');
const REG = path.join(CUR, 'regions');
const AP = path.join(CUR, 'appendix');
const PROG = path.join(CUR, 'programs');
const SRC = path.resolve(HERE, '..', 'src');

let bad = 0;
const err = (m) => { console.error(`  ✗ ${m}`); bad++; };
const say = (m) => console.log(`  · ${m}`);

/* ── الصيغة، بنفس تعابير `tools/verify.py` ── */
const TAGS = ['arch', 'abi', 'boot', 'qemu', 'ours', 'fw', 'unspec', 'host'];
const FOLD = { arch: 'spec', abi: 'spec', boot: 'spec', qemu: 'env', fw: 'env', host: 'env', ours: 'ours', unspec: 'none' };
const RUNS = /^<!--\s*runs:\s*(\S+)\s*-->$/;
const PART = /^<!--\s*part:\s*(\S+)\s*-->$/;
const OUT = /^<!--\s*out\s+@(\w+)\s*:\s*(.*?)\s*-->$/;

/* مراحل القالب، بنفس ترتيب الأسلوب `kernel-dfs` §٤ */
const TEMPLATE = [
  'المشكلة', 'الصورة العامة', 'الآلية الخام', 'البنية الداخلية', 'مسار التنفيذ',
  'أصغر implementation', 'التجربة', 'كسرها عمداً', 'كيف تفعلها الأنظمة الحقيقية',
  'الفخاخ التصوّرية', 'Checkpoint', 'Artifact', 'التمرين',
];
const stageOf = (t) => TEMPLATE.find((s) => t === s || t.startsWith(s + ':')) ?? null;
const plain = (s) => s.replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]*)\*\*/g, '$1').trim();

const files = fs.readdirSync(REG).filter((f) => f.endsWith('.md')).sort();
const nums = files.map((f) => f.slice(0, 2));

/* ── أ) جدول README مقابل ما في regions/ ── */
const readme = fs.readFileSync(path.join(CUR, 'README.md'), 'utf8');
const planned = [...readme.matchAll(/^\|\s*\[`(\d\d)`\]/gm)].map((m) => m[1]);
const missing = planned.filter((n) => !nums.includes(n));
const extra = nums.filter((n) => !planned.includes(n));
if (missing.length) err(`فصولٌ في جدول README بلا ملفّ: ${missing.join(' ')}`);
if (extra.length) err(`ملفّاتٌ في regions/ بلا صفٍّ في جدول README: ${extra.join(' ')}`);
say(`${nums.length} فصلاً، وجدولُ README يطابقها`);

/* ── ب) المراحل من `programs/stages.conf` ── */
const conf = fs.readFileSync(path.join(PROG, 'stages.conf'), 'utf8');
const stages = conf.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('|').map((x) => x.trim()));
const stageIds = new Set(stages.map((s) => s[0]));
const stageFiles = Object.fromEntries(stages.map((s) => [s[0], (s[1] ?? '').split(/\s+/).filter(Boolean)]));
say(`${stageIds.size} مرحلةً في stages.conf، منها ${[...stageIds].filter((s) => /x$/.test(s)).length} كسرٌ متعمَّد`);

for (const num of nums) {
  if (!stageIds.has(num) && num !== '00') err(`الفصل ${num}: لا مرحلة بهذا الرقم في stages.conf`);
}
/* ملفّ المرحلة إمّا تحت `kernel/` وإمّا مسارٌ صريحٌ تحت `programs/` — كـ`variants/` */
const progFile = (f) => fs.existsSync(path.join(PROG, 'kernel', f)) || fs.existsSync(path.join(PROG, f));
for (const [id, fl] of Object.entries(stageFiles)) {
  for (const f of fl) if (!progFile(f)) err(`stages.conf: المرحلة ${id} تذكر ملفّاً غير موجود — ${f}`);
}

/* ── ج) اللوحات والمقتطعات وأقسام القالب ── */
const fams = { spec: 0, env: 0, ours: 0, none: 0 };
let panels = 0, parts = 0, traces = 0, limits = 0, offTemplate = 0, subs = 0;
const brokenPanels = [];
const workingByCh = {};

for (const f of files) {
  const num = f.slice(0, 2);
  const lines = fs.readFileSync(path.join(REG, f), 'utf8').split('\n');
  let pendRun = null, pendPart = null;
  workingByCh[num] = new Set();

  lines.forEach((raw, i) => {
    const ln = raw.trim();
    const at = `${f}:${i + 1}`;

    let m = ln.match(RUNS);
    if (m) {
      pendRun = m[1];
      if (!stageIds.has(pendRun)) err(`${at}: runs يشير إلى مرحلةٍ ليست في stages.conf — ${pendRun}`);
      return;
    }
    m = ln.match(PART);
    if (m) {
      pendPart = m[1];
      parts++;
      if (!fs.existsSync(path.join(PROG, pendPart))) err(`${at}: part يشير إلى ملفٍّ غير موجود — ${pendPart}`);
      return;
    }
    m = ln.match(OUT);
    if (m) {
      const [, tag, note] = m;
      panels++;
      if (!TAGS.includes(tag)) err(`${at}: وسمٌ غير معروف @${tag}`);
      else fams[FOLD[tag]]++;
      if (!note) err(`${at}: وسم @${tag} بلا ملاحظةٍ تقول مستوى الرصد`);
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (!lines[j]?.startsWith('```')) err(`${at}: وسمُ out بلا كتلةٍ بعده`);
      if (pendRun) {
        if (/x$/.test(pendRun)) brokenPanels.push({ ch: num, stage: pendRun, at });
        else workingByCh[num].add(pendRun);
      }
      pendRun = null;
      return;
    }
    if (/^<!--\s*out\b/.test(ln)) err(`${at}: لوحةُ مخرَجٍ بلا وسم سلطة`);
    if (ln.startsWith('⚠')) limits++;

    const h2 = raw.match(/^##\s+(.+)$/);
    if (h2 && !stageOf(plain(h2[1]))) offTemplate++;
    if (/^###\s+/.test(raw)) subs++;
  });

  /* كتلةُ مسار التنفيذ: بلا لغة وفيها `↓` — تُعدّ بمسحٍ سطريّ لا بتعبيرٍ يتداخل */
  let open = null, buf = [];
  for (const raw of lines) {
    if (raw.startsWith('```')) {
      if (open === null) { open = raw.slice(3).trim(); buf = []; }
      else { if (!open && buf.some((l) => l.includes('↓'))) traces++; open = null; }
    } else if (open !== null) buf.push(raw);
  }
}

say(`${panels} لوحةَ مخرَج · ${parts} مقتطعاً من ملفّه · ${traces} مسارَ تنفيذٍ · ${limits} حدَّ ادّعاء`);
say(`العائلات — المواصفة ${fams.spec} · هذه البيئة ${fams.env} · قرارُنا ${fams.ours} · بلا مالك ${fams.none}`);
say(`${offTemplate} قسماً خارج قالب الاثنتي عشرة مرحلة، و${subs} عنواناً فرعياً`);

/*
 * ── د) زوج «تعمل / كُسِرت» ──
 *
 * الزوج يُعرَض حين توجد **لوحةٌ عاملةٌ واحدة بالضبط** للمرحلة الأصل في المنهج —
 * لا صفر ولا اثنتان. وما لا مقابل له يُعَدّ ويُذكَر: العرض يسقط إلى لوحةٍ
 * واحدة، والثقبُ المعلوم أهونُ من الصامت.
 */
const allWorking = Object.values(workingByCh).flatMap((s) => [...s]);
let paired = 0;
const lone = [];
for (const b of brokenPanels) {
  const base = b.stage.slice(0, -1);
  const n = allWorking.filter((x) => x === base).length;
  if (n === 1) paired++;
  else if (n === 0) lone.push(b.stage);
  else err(`${b.at}: مرحلةُ الكسر ${b.stage} تقابلها ${n} لوحاتٍ عاملة — الزوج يحتاج واحدةً`);
}
say(`${brokenPanels.length} لوحةَ كسرٍ متعمَّد: ${paired} مزدوجةٌ بلوحتها العاملة${lone.length ? ` · ${lone.join(' ')} بلا مقابلٍ فتُعرَض وحدها` : ''}`);

/* ── هـ) أقسامٌ منتظمة: الفخاخ عمودان، وArtifact خمسةُ صفوف ── */
const ART = ['مخطّط', 'تنفيذ', 'تجربةُ فشل', 'أثرُ تنفيذ', 'مقارنة'];
let arts = 0, traps = 0, cps = 0;
for (const f of files) {
  const s = fs.readFileSync(path.join(REG, f), 'utf8');
  const grab = (h) => {
    const m = s.match(new RegExp(`^## ${h}\\s*$\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm'));
    return m ? m[1] : null;
  };
  const a = grab('Artifact');
  if (a) {
    arts++;
    const labs = a.split('\n').filter((l) => l.trim().startsWith('|')).slice(2)
      .map((l) => l.split('|')[1].trim()).filter(Boolean);
    if (JSON.stringify(labs) !== JSON.stringify(ART)) err(`${f}: صفوف Artifact ليست الخمسة المعلَنة — ${labs.join(' · ')}`);
  }
  const t = grab('الفخاخ التصوّرية');
  if (t) {
    traps++;
    const head = t.split('\n').find((l) => l.trim().startsWith('|'));
    const cols = head.split('|').slice(1, -1).map((c) => c.trim());
    if (cols[0] !== 'الفخّ' || cols[1] !== 'الصواب') err(`${f}: جدول الفخاخ بعمودين غير «الفخّ» و«الصواب»`);
  }
  const c = grab('Checkpoint');
  if (c) {
    cps++;
    const qs = (c.match(/^[٠-٩]+\.\s/gm) ?? []).length;
    if (qs < 2) err(`${f}: Checkpoint بأقلّ من سؤالين`);
  }
}
say(`${arts} جدول Artifact · ${traps} جدول فخاخ · ${cps} بوّابة Checkpoint`);

/* ── و) الملاحق ── */
const aps = fs.readdirSync(AP).filter((f) => f.endsWith('.md'));
say(`${aps.length} ملحقاً`);

/* ── ز) ثنائية اللغة في مصدر الموقع ── */
const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const srcFiles = walk(SRC);
const ARABIC = /[؀-ۿ]/;

for (const p of srcFiles.filter((x) => /\.tsx?$/.test(x))) {
  const s = fs.readFileSync(p, 'utf8');
  s.split('\n').forEach((ln, i) => {
    if (/<text[ >]/.test(ln) && ARABIC.test(ln) && !/text-anchor|textAnchor/.test(ln))
      err(`${path.relative(SRC, p)}:${i + 1}: <text> عربيّ بلا text-anchor`);
  });
}

/*
 * ولا نصَّ عربيٍّ مكتوبٍ في مكوّنٍ بصنفٍ أحاديّ.
 *
 * وهذا فحصُ **مصدرٍ** لا تصيير، لأن التصيير لا يمرّ على كل حال: وسمُ «قبل فتح
 * المصدر» في `Trail.tsx` لا يظهر إلا بعد أن يكتب القارئ توقّعه، فلا يراه
 * `ssr-check` أصلاً — ورآه هذا.
 */
const MONO_CLASSES = (() => {
  const out = new Set();
  const all = ['components.css', 'base.css', 'layout.css']
    .map((f) => fs.readFileSync(path.join(SRC, 'styles', f), 'utf8')).join('\n');
  for (const m of all.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!/--k-mono/.test(m[2])) continue;
    for (const c of m[1].matchAll(/\.([\w-]+)/g)) out.add(c[1]);
  }
  return out;
})();

for (const p of srcFiles.filter((x) => /\.tsx$/.test(x))) {
  fs.readFileSync(p, 'utf8').split('\n').forEach((ln, i) => {
    for (const m of ln.matchAll(/className="([^"]*)"[^>]*>([^<{]*)/g)) {
      const cls = m[1].split(/\s+/).find((c) => MONO_CLASSES.has(c));
      if (cls && ARABIC.test(m[2])) err(`${path.relative(SRC, p)}:${i + 1}: نصٌّ عربيّ في صنفٍ أحاديّ .${cls}`);
    }
  });
}

/* المونو للكود والأرقام فقط — كل مُحدِّدٍ يستعمله لا يحمل عربية */
const css = fs.readFileSync(path.join(SRC, 'styles/components.css'), 'utf8')
  + fs.readFileSync(path.join(SRC, 'styles/base.css'), 'utf8')
  + fs.readFileSync(path.join(SRC, 'styles/layout.css'), 'utf8');
const monoSel = [];
const missingIso = [];
for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  const sel = m[1].trim().replace(/\s+/g, ' ');
  const body = m[2];
  if (!/--k-mono/.test(body)) continue;
  monoSel.push(sel);
  /* `pre` و`code` معزولان في `base.css` أصلاً، وما عداهما يعزل نفسه */
  if (!/unicode-bidi|direction/.test(body) && !/\bpre\b|\bcode\b/.test(sel)) missingIso.push(sel);
}
if (missingIso.length) err(`محدِّدٌ بخطٍّ أحاديّ بلا عزل اتجاه: ${missingIso.join(' · ')}`);
say(`${monoSel.length} مُحدِّداً بالخطّ الأحاديّ، وكلُّها معزولةُ الاتجاه`);

if (/letter-spacing/.test(css)) err('تباعد حروف في أنماط الموقع — يقطع العربية');

console.log(bad ? `\n✗ ${bad} خطأً` : '\n✓ المحتوى والموقع متطابقان');
process.exit(bad ? 1 : 0);
