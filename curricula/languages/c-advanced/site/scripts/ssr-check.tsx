/**
 * فحص التصيير — كل مسارٍ وكل قسمٍ يُصيَّر بلا متصفّح، ويُقرأ الناتج.
 * يكشف الانهيار والماركداون المتسرّب، **ولا يرى مظهراً**: الخطّ واللون
 * والتخطيط لا تراها إلا `tools/screens.mjs`.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import { Home } from '../src/pages/Home';
import { ChapterPage } from '../src/pages/Chapter';
import { SourcesPage } from '../src/pages/Sources';
import { LabPage } from '../src/pages/Lab';
import { TrailPage } from '../src/pages/Trail';
import { chapters } from '../src/content/regions';
import { axioms, packs, planRows } from '../src/content/plan';

const app = (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/f/:num" element={<ChapterPage />} />
    <Route path="/f/:num/:shot" element={<ChapterPage />} />
    <Route path="/sources" element={<SourcesPage />} />
    <Route path="/lab" element={<LabPage />} />
    <Route path="/trail" element={<TrailPage />} />
  </Routes>
);

const paths = [
  '/', '/sources', '/lab', '/trail',
  ...chapters.flatMap((c) => [`/f/${c.num}`, ...c.shots.map((_, i) => `/f/${c.num}/${i}`)]),
];

let bad = 0;
const err = (m: string) => { console.error(`  ✗ ${m}`); bad++; };

/** ما يقرؤه القارئ: بلا وسوم، وبلا ما داخل `code`/`pre`. */
const bare = (html: string) =>
  html.replace(/<(code|pre)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ');

let gates = 0;
let panels = 0;

for (const p of paths) {
  let html = '';
  try {
    html = renderToString(<StaticRouter location={p}>{app}</StaticRouter>);
  } catch (e) {
    err(`${p}: ${(e as Error).message}`);
    continue;
  }
  if (html.length < 400) { err(`${p}: تصييرٌ فارغ`); continue; }

  const text = bare(html);
  if (/\*\*/.test(text)) err(`${p}: توكيدٌ خام \`**\` يصل القارئ`);
  if (/`/.test(text)) err(`${p}: علامةُ كودٍ خام يصل القارئ`);
  if (/\]\(/.test(text)) err(`${p}: رابطُ ماركداون لم يُصرَّف`);

  /* الأحاديّ يفكّ وصل الحروف: لا حرفَ عربيٍّ داخل `.en`. والأرقام مباحة. */
  for (const m of html.matchAll(/class="[^"]*\ben\b[^"]*"[^>]*>([^<]{1,120})/g)) {
    if (/[\u0621-\u064A\u0671-\u06D3]/.test(m[1]!)) err(`${p}: عربيٌّ في الأحاديّ — «${m[1]!.trim().slice(0, 40)}»`);
  }

  gates += (html.match(/class="predict"/g) ?? []).length;
  panels += (html.match(/class="panel panel-/g) ?? []).length;
}

/* الخطّة مقروءةٌ من README، لا مكتوبةً في الكود */
if (packs.length !== 4) err(`الحِزَم ${packs.length} — والمقروء من README أربع`);
if (axioms.length !== 5) err(`البديهيات ${axioms.length} — والمقروء من README خمس`);
if (planRows.length !== chapters.length) err(`صفوف الجدول ${planRows.length} مقابل ${chapters.length} فصلاً`);

/* بوّابات التوقّع تُصيَّر فعلاً، لا يسقطها التصريف */
if (gates !== 5) err(`بوّابات التوقّع المصيَّرة ${gates} — والمقروء من المتن خمس`);

console.log(`  · ${paths.length} مساراً · ${panels} لوحةً مصيَّرة · ${gates} بوّابة`);
if (bad) { console.error(`\n✗ ${bad} مخالفة`); process.exit(1); }
console.log('\n✓ كل المسارات تُصيَّر');
