/**
 * فحص التصيير — كل مسارٍ يُصيَّر بلا متصفّح. يكشف الانهيار، **ولا يرى مظهراً**:
 * الخطُّ واللون والتخطيط لا تراها إلا `tools/screens.mjs`.
 *
 * ومعه أربعة فحوصٍ للمحتوى:
 *   ١) الماركداون الخام لا يصل القارئ — لا `**` ولا `` ` `` خارج `code`/`pre`
 *   ٢) كل مختبرٍ يطابق **لقطةً واحدة بالضبط** — لا صفر ولا اثنتين
 *   ٣) جدول «وتفصيلُها» في الريدمي يطابق `regions/` ١:١
 *   ٤) كل رقم إقليمٍ في عمود «أين يعود» موجودٌ فعلاً — فالخلاصة ملاحة
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import { Home } from '../src/pages/Home';
import { RegionPage } from '../src/pages/RegionPage';
import { TracePage } from '../src/pages/TracePage';
import { regions } from '../src/content/regions';
import { briefs, packs, axioms, authorities } from '../src/content/readme';
import { labs } from '../src/content/labs';
import { inline } from '../src/lib/md';

const app = (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/r/:no" element={<RegionPage />} />
    <Route path="/r/:no/:s" element={<RegionPage />} />
    <Route path="/trace" element={<TracePage />} />
  </Routes>
);

/* كل لقطةٍ مسارٌ قائمٌ بذاته: تُشارَك، ويُصيَّرها الفحص، ويلتقطها المتصفّح */
const paths = [
  '/', '/trace',
  ...regions.flatMap((r) => r.shots.map((_, i) => `/r/${r.no}/${i}`)),
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
  if (/(\*\*|`)/.test(bare(inline(r.name)))) fail(`عنوانٌ فيه ماركداون خام: ${r.no}`);
  for (const s of r.shots) if (/(\*\*|`)/.test(bare(inline(s.title)))) fail(`عنوان لقطةٍ خام: ${r.no} · ${s.title}`);
}

/* ٢ — كل مختبرٍ يطابق لقطةً واحدة */
for (const l of labs) {
  const hits = regions
    .filter((r) => r.no === l.region)
    .flatMap((r) => r.shots.filter((s) => s.title.includes(l.after)));
  if (hits.length !== 1) fail(`المختبر «${l.id}» طابق ${hits.length} لقطة — والمطلوب واحدة`);
}

/* ٣ — جدول الريدمي مقابل الملفّات */
const inReadme = Object.keys(briefs).sort();
const onDisk = regions.map((r) => r.no).sort();
if (inReadme.join() !== onDisk.join()) {
  fail(`جدول «وتفصيلُها» لا يطابق regions/: الريدمي ${inReadme.length} · الملفّات ${onDisk.length}`);
}

/* ٤ — روابط «أين يعود» الأمامية */
const known = new Set(onDisk);
for (const r of regions) {
  for (const row of r.summary) {
    for (const no of row.next) if (!known.has(no)) fail(`${r.no}: الخلاصة تحيل إلى إقليمٍ غير موجود ${no}`);
  }
}

/* ٥ — الجداول التي تبني الواجهة ليست فارغة */
if (axioms.length !== 5) fail(`البديهيات ${axioms.length} — والمنهج يعلن خمساً`);
if (packs.length !== 5) fail(`الحِزَم ${packs.length} — والمنهج يعلن خمساً`);
if (authorities.length !== 4) fail(`السلطات ${authorities.length} — والمنهج يعلن أربعاً`);

const shots = regions.reduce((n, r) => n + r.shots.length, 0);
const panels = regions.reduce(
  (n, r) => n + r.shots.reduce((m, s) => m + s.blocks.reduce((k, b) => {
    if (b.kind === 'run') return k + b.panels.length;
    if (b.kind === 'facets') return k + b.runs.reduce((x, y) => x + y.panels.length, 0);
    return k;
  }, 0), 0),
  0
);
const figures = regions.reduce(
  (n, r) => n + r.shots.reduce((m, s) => m + s.blocks.filter((b) => b.kind === 'figure').length, 0), 0);
const gates = regions.reduce(
  (n, r) => n + r.shots.reduce((m, s) => m + s.blocks.reduce((k, b) =>
    k + (b.kind === 'run' ? b.panels.filter((p) => p.gate).length : 0), 0), 0), 0);

console.log(
  `${paths.length} مساراً · ${regions.length} إقليماً · ${shots} لقطة · ` +
  `${panels} لوحة · ${figures} رسماً · ${gates} بوّابة · ${labs.length} مختبراً`
);
if (bad) { console.error(`${bad} مخالفة`); process.exit(1); }
console.log('✓ كل المسارات تُصيَّر، والمحتوى مطابق');
