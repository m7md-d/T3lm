/**
 * فحص التصيير — كل مسارٍ يُصيَّر بلا متصفّح. يكشف الانهيار، **ولا يرى مظهراً**:
 * الخطُّ واللون والتخطيط لا تراها إلا `tools/screens.mjs`.
 *
 * ومعه خمسة فحوصٍ للمحتوى:
 *   ١) الماركداون الخام لا يصل القارئ — لا `**` ولا `` ` `` خارج `code`/`pre`
 *   ٢) جدول الطريق في الريدمي يغطّي كلَّ ما في `regions/`
 *   ٣) الجداول التي تبني الواجهة ليست فارغة: الضوامن والانهيارات والحِزَم
 *   ٤) كلُّ مختبرٍ يطابق **قسماً واحداً** بالضبط، وبذورُه ملفّاتٌ موجودة
 *   ٥) كلُّ سؤال توقّعٍ يقفل كتلةً بعده، ولا سؤالَ معلّق
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import { Home } from '../src/pages/Home';
import { RegionPage } from '../src/pages/RegionPage';
import { regions } from '../src/content/regions';
import { collapses, guarantors, packs } from '../src/content/facts';
import { labs } from '../src/content/labs';
import { inline } from '../src/lib/md';

const app = (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/r/:no" element={<RegionPage />} />
    <Route path="/r/:no/:s" element={<RegionPage />} />
  </Routes>
);

/* كل قسمٍ مسارٌ قائمٌ بذاته: يُشارَك، ويُصيَّره الفحص، ويلتقطه المتصفّح.
   والأرضيّة مسارٌ زائد: `shots.length`. */
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
  for (const s of r.shots) {
    if (/(\*\*|`)/.test(bare(inline(s.title)))) fail(`عنوانُ قسمٍ خام: ${r.num} · ${s.title}`);
  }
  /* «الفصل التالي» يُعرَض نصّاً لا HTML، فلا يجوز أن يحمل ماركداون. */
  if (r.next && /(\*\*|`)/.test(r.next)) fail(`«الفصل التالي» فيه ماركداون خام: ${r.num}`);
}

/* ٢ — جدول الطريق مقابل الملفّات */
const covered = new Set<number>();
for (const p of packs) for (let n = p.from; n <= p.to; n++) covered.add(n);
for (const r of regions) if (!covered.has(r.n)) fail(`الفصل ${r.num} ليس في جدول الطريق`);

/* ٣ — الجداول التي تبني الواجهة */
if (guarantors.length !== 4) fail(`الضوامن ${guarantors.length} — والفصل 00 يعلن أربعة`);
if (collapses.length !== 3) fail(`الانهيارات ${collapses.length} — والفصل 00 يعلن ثلاثة`);
if (packs.length !== 6) fail(`صفوف الطريق ${packs.length} — والريدمي يعلن ستّة (الفصل صفر وخمسُ حِزَم)`);

/* ٤ — كلُّ مختبرٍ يطابق قسماً واحداً، وبذورُه موجودة */
const EX = new URL('../../examples/', import.meta.url).pathname;
for (const l of labs) {
  const hits = regions
    .filter((r) => r.num === l.region)
    .flatMap((r) => r.shots.filter((s) => s.title.includes(l.after)));
  if (hits.length !== 1) fail(`المختبر «${l.id}» طابق ${hits.length} قسماً — والمطلوب واحد`);
  for (const s of l.seeds) if (!existsSync(join(EX, s))) fail(`بذرةٌ لا ملفَّ لها: examples/${s}`);
}

/* ٥ — سؤال التوقّع يقفل كتلةً بعده */
let shots = 0, panels = 0, gates = 0, code = 0, tasks = 0, files = 0;
const count = (blocks: import('../src/lib/types').Block[], where: string) => {
  blocks.forEach((b, i) => {
    if (b.t === 'panel') panels++;
    if (b.t === 'code') { code++; if (b.task) tasks++; if (b.file || b.from) files++; }
    if (b.t === 'gate') {
      gates++;
      const next = blocks[i + 1];
      if (!next || next.t !== 'panel') fail(`سؤالٌ لا يقفل كتلةً: ${where}`);
    }
  });
};
for (const r of regions) {
  if (r.exercise) count(r.exercise, `${r.num} · التمرين`);
  for (const s of r.shots) { shots++; count(s.blocks, `${r.num} · ${s.title}`); }
}
for (const r of regions) if (!r.next && r.n !== regions[regions.length - 1]!.n) {
  fail(`الفصل ${r.num} بلا سطر «الفصل التالي»`);
}

console.log(
  `${paths.length} مساراً · ${regions.length} فصلاً · ${shots} قسماً · ` +
  `${panels} كتلةَ نصٍّ · ${code} كتلةَ كودٍ (${files} بملفّ · ${tasks} للقارئ) · ` +
  `${gates} سؤالَ توقّعٍ · ${labs.length} مختبراً`
);
if (bad) { console.error(`${bad} مخالفة`); process.exit(1); }
console.log('✓ كل المسارات تُصيَّر، والمحتوى مطابق');
