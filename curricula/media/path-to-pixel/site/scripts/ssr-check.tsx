/**
 * فحص التصيير — كل مسارٍ يُصيَّر بلا متصفّح. يكشف الانهيار، **ولا يرى مظهراً**:
 * الخطُّ واللون والتخطيط لا تراها إلا `tools/screens.mjs`.
 *
 * ومعه ستّة فحوصٍ للمحتوى:
 *   ١) الماركداون الخام لا يصل القارئ
 *   ٢) جدول الطريق في الريدمي يغطّي كلَّ ما في `regions/` ١:١
 *   ٣) الجداول التي تبني الواجهة ليست فارغة
 *   ٤) كلُّ مختبرٍ يطابق لقطةً واحدةً بالضبط
 *   ٥) كلُّ بوّابةٍ تقفل لوحةً بعدها
 *   ٦) **حسابُ المختبر الحيّ يطابق ما قاسه المنهج** — وهذا ما يجعل الحساب
 *      في المتصفّح ادّعاءً مفحوصاً لا تنفيذاً موازياً
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import { Home } from '../src/pages/Home';
import { RegionPage } from '../src/pages/RegionPage';
import { regions } from '../src/content/regions';
import { axioms, hairline, ladder, samples, shapes, winding } from '../src/content/facts';
import { packs } from '../src/content/readme';
import { labs } from '../src/content/labs';
import { coverage } from '../src/components/labs/Hairline';
import { inline } from '../src/lib/md';

const app = (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/r/:no" element={<RegionPage />} />
    <Route path="/r/:no/:s" element={<RegionPage />} />
  </Routes>
);

const paths = [
  '/',
  ...regions.flatMap((r) => [...r.shots.map((_, i) => `/r/${r.num}/${i}`), `/r/${r.num}/${r.shots.length}`]),
];

let bad = 0;
const fail = (m: string) => { console.error(`✗ ${m}`); bad++; };

for (const path of paths) {
  try {
    const html = renderToString(<StaticRouter location={path}>{app}</StaticRouter>);
    if (html.length < 400) fail(`${path}: تصييرٌ فارغ`);
  } catch (e) {
    fail(`${path}: ${(e as Error).message}`);
  }
}

/* ١ — الماركداون الخام */
const bare = (h: string) => h.replace(/<(code|pre)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '');
for (const r of regions) {
  if (/(\*\*|`)/.test(bare(inline(r.title)))) fail(`عنوانٌ فيه ماركداون خام: ${r.num}`);
  for (const s of r.shots) if (/(\*\*|`)/.test(bare(inline(s.title)))) fail(`عنوان لقطةٍ خام: ${r.num} · ${s.title}`);
}

/* ٢ — جدول الطريق مقابل الملفّات */
const covered = new Set<number>();
for (const p of packs) for (let n = p.from; n <= p.to; n++) covered.add(n);
for (const r of regions) if (!covered.has(r.n)) fail(`الإقليم ${r.num} ليس في جدول الطريق`);
for (const n of covered) if (!regions.some((r) => r.n === n)) fail(`الطريق يعلن إقليماً ${n} ولا ملفّ له`);

/* ٣ — الجداول التي تبني الواجهة */
if (axioms.length !== 5) fail(`البديهيات ${axioms.length} — والمنهج يعلن خمساً`);
if (packs.length !== 6) fail(`صفوف الطريق ${packs.length} — والريدمي يعلن ستّة`);
if (ladder.length !== 3) fail(`سلّم التشخيص ${ladder.length} صفوف — والفصل صفر ثلاثة`);
if (hairline.length !== 6) fail(`حالات الرقيق ${hairline.length} — واللوحة ستّ`);
if (winding.length !== 4) fail(`صفوف اللفّ ${winding.length} — واللوحة أربعة`);
if (samples.length !== 4) fail(`صفوف العيّنات ${samples.length} — واللوحة أربعة`);
for (const k of ['star', 'ring', 'ring-same']) if (!shapes[k]) fail(`ملفُّ الشكل ناقص: ${k}.path`);

/* ٤ — كل مختبرٍ يطابق لقطةً واحدة بالضبط */
for (const l of labs) {
  const hits = regions
    .filter((r) => r.num === l.region)
    .flatMap((r) => r.shots.filter((s) => s.title.includes(l.after)));
  if (hits.length !== 1) fail(`المختبر «${l.id}» طابق ${hits.length} لقطة — والمطلوب واحدة`);
}

/* ٦ — الحسابُ الحيّ ضدّ ما قاسه المنهج */
for (const h of hairline) {
  const a = coverage(h.y, h.w, h.rowA);
  const b = coverage(h.y, h.w, h.rowB);
  if (Math.abs(a - h.covA) > 5e-4 || Math.abs(b - h.covB) > 5e-4)
    fail(`مختبر الرقيق يخالف اللوحة عند y=${h.y} w=${h.w}: ` +
         `(${a.toFixed(3)}, ${b.toFixed(3)}) بدل (${h.covA}, ${h.covB})`);
}

/* ٥ — البوّابة تقفل لوحةً بعدها */
let shots = 0, panels = 0, gates = 0, code = 0, tasks = 0, files = 0, refs = 0, maths = 0;
const count = (blocks: import('../src/lib/types').Block[], where: string) => {
  blocks.forEach((b, i) => {
    if (b.t === 'panel') { panels++; if (b.kind === 'ref') refs++; }
    if (b.t === 'math') maths++;
    if (b.t === 'code') { code++; if (b.task) tasks++; if (b.file || b.head) files++; }
    if (b.t === 'gate') {
      gates++;
      const next = blocks[i + 1];
      if (!next || next.t !== 'panel') fail(`بوّابةٌ لا تقفل لوحة: ${where}`);
    }
  });
};
for (const r of regions) {
  if (r.exercise) count(r.exercise, `${r.num} · التمرين`);
  if (r.summary) count(r.summary, `${r.num} · الخلاصة`);
  for (const s of r.shots) { shots++; count(s.blocks, `${r.num} · ${s.title}`); }
}

console.log(
  `${paths.length} مساراً · ${regions.length} إقليماً · ${shots} لقطة · ` +
  `${panels} لوحة (${refs} قياساً ضدّ Skia) · ${code} بلوكاً (${files} بملفّ · ${tasks} للقارئ) · ` +
  `${maths} صيغة · ${gates} بوّابة · ${labs.length} مختبرات`
);
if (bad) { console.error(`${bad} مخالفة`); process.exit(1); }
console.log('✓ كل المسارات تُصيَّر، والمحتوى مطابق، والمختبرُ يطابق قياسه');
