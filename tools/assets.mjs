#!/usr/bin/env node
/**
 * يولّد أصول التطبيق من مصادرها في `site/assets/` إلى `site/public/`.
 *
 *   node tools/assets.mjs <site-dir>
 *
 * الاصطلاح — لا إعداد:
 *   assets/icon.html          ⇒ icons/icon-192.png · icon-512.png · apple-touch-icon.png (180)
 *   assets/icon-maskable.html ⇒ icons/icon-maskable-192.png · icon-maskable-512.png
 *   assets/og.html            ⇒ og.png (1200×630)
 *
 * ومصادرها HTML لا SVG **لتستعمل خطّ الموقع نفسه** المستضاف في `public/fonts/`.
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { shot } from './shot.mjs';

const site = process.argv[2];
if (!site) {
  console.error('الاستعمال: node tools/assets.mjs <site-dir>');
  process.exit(1);
}

const src = (n) => join(site, 'assets', n);
const pub = (n) => join(site, 'public', n);
await mkdir(pub('icons'), { recursive: true });

const jobs = [
  ['icon.html', 'icons/icon-512.png', 512],
  ['icon.html', 'icons/icon-192.png', 192],
  ['icon.html', 'icons/apple-touch-icon.png', 180],
  ['icon-maskable.html', 'icons/icon-maskable-512.png', 512],
  ['icon-maskable.html', 'icons/icon-maskable-192.png', 192],
];

let n = 0;
for (const [from, to, size] of jobs) {
  if (!existsSync(src(from))) { console.error(`✗ ناقص: ${src(from)}`); process.exit(1); }
  const bytes = await shot(src(from), pub(to), size, size);
  console.log(`  ${to.padEnd(34)} ${String(size).padStart(4)}²  ${(bytes / 1024).toFixed(1)}ك`);
  n++;
}

if (existsSync(src('og.html'))) {
  const bytes = await shot(src('og.html'), pub('og.png'), 1200, 630);
  console.log(`  ${'og.png'.padEnd(34)} 1200×630  ${(bytes / 1024).toFixed(1)}ك`);
  n++;
}

console.log(`✓ ${n} أصلاً في ${pub('')}`);
