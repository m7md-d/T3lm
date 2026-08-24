#!/usr/bin/env node
/**
 * يكتب عامل خدمةٍ لمخرَج البناء — بقائمة تخزينٍ مسبقٍ حقيقية.
 *
 *   node tools/sw.mjs <site-dir>        (بعد `vite build`)
 *
 * يُقرأ `dist/` كما هو، فالأسماء مبصومة وتتغيّر مع كل بناء — واسم المخزن
 * يحمل بصمة القائمة، فالنسخة القديمة تُحذف عند التفعيل بلا تدخّل.
 *
 * **وما كبر عن حدٍّ لا يُخزَّن مسبقاً** (مفسّر Go ١٣ ميغابايت): يُخزَّن عند أوّل
 * طلبٍ له بدل أن يُثقل التثبيت.
 */
import { readdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';

const site = process.argv[2];
if (!site) { console.error('الاستعمال: node tools/sw.mjs <site-dir>'); process.exit(1); }

const dist = join(site, 'dist');
const PRECACHE_MAX = 2 * 1024 * 1024;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = (await walk(dist)).filter((f) => !f.endsWith(`${sep}sw.js`));
const hash = createHash('sha256');
const precache = [];
let skipped = 0;

for (const f of files.sort()) {
  const body = await readFile(f);
  hash.update(relative(dist, f)).update(body);
  const url = './' + relative(dist, f).split(sep).join('/');
  if (body.length <= PRECACHE_MAX) precache.push(url);
  else skipped++;
}

const version = hash.digest('hex').slice(0, 12);

/* أصلٌ خارجيّ في المخرَج يكسر «يعمل بلا شبكة» — ويُكتشَف عادةً بعد النشر.
   الفحص على المراجع لا على النصّ: رابطٌ في متن المنهج ليس أصلاً يُجلَب. */
const external = [];
for (const f of files) {
  const ext = f.slice(f.lastIndexOf('.'));
  if (ext !== '.html' && ext !== '.css') continue;
  const body = await readFile(f, 'utf8');
  for (const re of [
    /<(?:link|script|img|source)\b[^>]*?\b(?:href|src)=["'](https?:\/\/[^"']+)/gi,
    /url\(\s*["']?(https?:\/\/[^"')]+)/gi,
    /@import\s+["'](https?:\/\/[^"']+)/gi,
  ]) for (const m of body.matchAll(re)) external.push(`${relative(dist, f)} → ${m[1]}`);
}
if (external.length) {
  console.error('✗ أصولٌ خارجية في المخرَج — «يعمل بلا شبكة» ادّعاءٌ كاذب:');
  for (const e of external) console.error('  ' + e);
  process.exit(1);
}

const sw = `/* مولَّد — tools/sw.mjs. لا يُحرَّر بيد. */
const VERSION = '${version}';
const CACHE = 't3lm-' + VERSION;
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  /* التنقّل: الصدفة من المخزن دائماً — والمسار يعيش بعد # فلا يصل هنا أصلاً. */
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then((r) => r || fetch(req)));
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
`;

await writeFile(join(dist, 'sw.js'), sw);
console.log(
  `✓ sw.js · ${precache.length} ملفّاً مخزَّناً مسبقاً` +
    (skipped ? ` · ${skipped} أكبر من ٢م يُخزَّن عند أوّل طلب` : '') +
    ` · ${version}`
);
