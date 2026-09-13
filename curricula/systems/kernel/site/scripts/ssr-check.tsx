/**
 * فحص التصيير — كل مسارٍ وكل لقطةٍ تُصيَّر بلا متصفّح، ويُقرأ الناتج.
 * يكشف الانهيار والماركداون المتسرّب، **ولا يرى مظهراً**: الخطّ واللون
 * والتخطيط لا تراها إلا `tools/screens.mjs`.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import { Home } from '../src/pages/Home';
import { Chapter } from '../src/pages/Chapter';
import { Sources } from '../src/pages/Sources';
import { Trail } from '../src/pages/Trail';
import { Appendix } from '../src/pages/Appendix';
import { chapters } from '../src/content/regions';
import { docs } from '../src/content/appendix';
import { axioms, packs, tagRows } from '../src/content/plan';
import { stages } from '../src/content/stages';
import fs from 'node:fs';
import path from 'node:path';

/** أصناف الخطّ الأحاديّ — تُقرأ من الأنماط نفسها، فلا تتقادم قائمةٌ مكتوبة. */
const MONO = [...new Set(
  ['components.css', 'base.css', 'layout.css']
    .map((f) => fs.readFileSync(path.resolve('src/styles', f), 'utf8'))
    .join('\n')
    .split(/\}/)
    .filter((b) => /--k-mono/.test(b))
    .flatMap((b) => [...b.split('{')[0]!.matchAll(/\.([\w-]+)/g)].map((m) => m[1]!)),
)];

const app = (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/ch/:num" element={<Chapter />} />
    <Route path="/sources" element={<Sources />} />
    <Route path="/trail" element={<Trail />} />
    <Route path="/appendix" element={<Appendix />} />
    <Route path="/appendix/:slug" element={<Appendix />} />
  </Routes>
);

const paths = [
  '/', '/sources', '/trail', '/appendix',
  ...docs.map((d) => `/appendix/${d.slug}`),
  ...chapters.flatMap((c) => c.shots.map((_, i) => `/ch/${c.num}#s${i}`)),
];

let bad = 0;
const err = (m: string) => { console.error(`  ✗ ${m}`); bad++; };

/** ما يقرؤه القارئ: بلا وسوم، وبلا ما داخل `code`/`pre`. */
const bare = (html: string) =>
  html.replace(/<(code|pre)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ');

let panels = 0;
let builds = 0;
let rails = 0;

for (const p of paths) {
  let html = '';
  try {
    html = renderToString(<StaticRouter location={p}>{app}</StaticRouter>);
  } catch (e) {
    err(`${p}: ${(e as Error).message}`);
    continue;
  }
  /* `/trail` قبل أيّ عبورٍ حالةٌ فارغةٌ مقصودة، وهي أقصر من صفحةٍ ذات محتوى */
  if (html.length < (p === '/trail' ? 200 : 400)) { err(`${p}: تصييرٌ فارغ`); continue; }

  const text = bare(html);
  if (/\*\*/.test(text)) err(`${p}: توكيدٌ خام \`**\` يصل القارئ`);
  if (/`/.test(text)) err(`${p}: علامةُ كودٍ خام تصل القارئ`);
  if (/\]\(/.test(text)) err(`${p}: رابطُ ماركداون لم يُصرَّف`);

  /*
   * الأحاديّ يفكّ وصل الحروف: لا حرفَ عربيٍّ في أي صنفٍ يحمله. والأصناف
   * تُقرأ من `components.css` نفسه فلا تُكتَب هنا قائمةً تتقادم.
   */
  for (const m of html.matchAll(/class="([^"]*)"[^>]*>([^<]{1,160})/g)) {
    const cls = m[1]!.split(/\s+/).find((c) => MONO.includes(c));
    if (cls && /[ء-يٱ-ۓ]/.test(m[2]!)) err(`${p}: عربيٌّ في الأحاديّ .${cls} — «${m[2]!.trim().slice(0, 40)}»`);
  }

  panels += (html.match(/class="panel"/g) ?? []).length;
  builds += (html.match(/class="build"/g) ?? []).length;
  rails += (html.match(/class="rail"/g) ?? []).length;
}

/* الخطّة مقروءةٌ من README، لا مكتوبةً في الكود */
if (packs.length !== 7) err(`الحِزَم ${packs.length} — والمقروء من README سبع`);
if (axioms.length !== 5) err(`البديهيات ${axioms.length} — والمقروء من README خمس`);
if (tagRows.length !== 8) err(`وسوم السلطة ${tagRows.length} — والمقروء من README ثمانية`);
if (stages.length !== 33) err(`المراحل ${stages.length} — والمقروء من stages.conf ثلاثٌ وثلاثون`);

/* لوحُ البناء يظهر في كل فصلٍ له مرحلة — أي ما عدا `00` */
const withStage = chapters.filter((c) => stages.some((s) => s.id === c.num));
const shotsOfThose = withStage.reduce((n, c) => n + c.shots.length, 0);
if (builds !== shotsOfThose) err(`لوحُ البناء ظهر ${builds} مرّةً، والمتوقّع ${shotsOfThose}`);

console.log(`  · ${paths.length} مساراً · ${panels} لوحةً مصيَّرة · ${builds} لوحَ بناء · ${rails} شريطَ مراحل`);
if (MONO.length < 8) err(`أصنافُ الأحاديّ المقروءة ${MONO.length} — القراءة من الأنماط فشلت`);
console.log(`  · ${MONO.length} صنفاً أحادياً مفحوصاً: ${MONO.join(' ')}`);
if (bad) { console.error(`\n✗ ${bad} مخالفة`); process.exit(1); }
console.log('\n✓ كل المسارات تُصيَّر');
