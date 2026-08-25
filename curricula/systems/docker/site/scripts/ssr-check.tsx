/**
 * فحص التصيير — كل مسارٍ يُصيَّر بلا متصفّح. يكشف الانهيار، ولا يرى مظهراً:
 * الخطُّ واللون والتخطيط لا تراها إلا `tools/screens.mjs`.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Home } from '../src/pages/Home';
import { PackagePage } from '../src/pages/PackagePage';
import { RegionPage } from '../src/pages/RegionPage';
import { TracePage } from '../src/pages/TracePage';
import { KitPage } from '../src/pages/KitPage';
import { Route, Routes } from 'react-router-dom';
import { regions } from '../src/content/regions';
import { packages } from '../src/content/packages';
import { inline } from '../src/lib/md';

const app = (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/p/:id" element={<PackagePage />} />
    <Route path="/r/:no" element={<RegionPage />} />
    <Route path="/trace" element={<TracePage />} />
    <Route path="/kit" element={<KitPage />} />
  </Routes>
);

const paths = [
  '/', '/trace', '/kit',
  ...packages.map((p) => `/p/${p.id}`),
  ...regions.map((r) => `/r/${r.no}`),
];

let bad = 0;
for (const path of paths) {
  try {
    const html = renderToString(<StaticRouter location={path}>{app}</StaticRouter>);
    if (html.length < 200) { console.error(`✗ ${path}: تصييرٌ فارغ`); bad++; }
  } catch (e) {
    console.error(`✗ ${path}: ${(e as Error).message}`);
    bad++;
  }
}

/* الماركداون الخام لا يصل القارئ. يُقرأ **المصرَّف** خارج `code`/`pre`،
   لا المصدر: عنوانٌ فيه `mount` سليمٌ في الماركداون وخطأٌ لو وصل بعلامته. */
const bare = (html: string) => html.replace(/<(code|pre)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '');
const rawLeak = regions.filter((r) => /(\*\*|`)/.test(bare(inline(r.title))));
if (rawLeak.length) { console.error(`✗ عناوين فيها ماركداون خام: ${rawLeak.map((r) => r.no).join(' ')}`); bad += rawLeak.length; }

console.log(`${paths.length} مساراً · ${regions.length} إقليماً · ${packages.length} حِزَم`);
if (bad) { console.error(`${bad} مخالفة`); process.exit(1); }
console.log('✓ كل المسارات تُصيَّر');
