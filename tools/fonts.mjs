#!/usr/bin/env node
/**
 * يستضيف خطوط Google محلياً.
 *
 * يطلب CSS بوكيلٍ يفهم woff2، فيعطي Google كتلاً مقسّمة بـ`unicode-range`.
 * تُنزَّل الكتل المطلوبة وحدها — العربية واللاتينية — ويُكتَب CSS محليّ بجانبها.
 *
 *   node tools/fonts.mjs <site-dir> "<google-css-url>"
 *
 * المخرَج: <site-dir>/public/fonts/*.woff2 و fonts.css
 * وهو **يُلتزَم في المستودع**: البناء لا يحتاج شبكة، وهذا وحده يحتاجها.
 */
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const KEEP = new Set(['arabic', 'latin', 'latin-ext']);

const [siteDir, cssUrl] = process.argv.slice(2);
if (!siteDir || !cssUrl) {
  console.error('الاستعمال: node tools/fonts.mjs <site-dir> "<google-css-url>"');
  process.exit(1);
}

const outDir = join(siteDir, 'public', 'fonts');
await mkdir(outDir, { recursive: true });

/** يمسح ما سبق، فلا تتراكم كتلٌ لم تعد مطلوبة. */
for (const f of await readdir(outDir).catch(() => [])) await unlink(join(outDir, f));

const css = await (await fetch(cssUrl, { headers: { 'User-Agent': UA } })).text();

/** كل كتلة مسبوقةٌ بتعليقٍ يسمّي المجموعة: `/* arabic *​/`. */
const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g)];
if (!blocks.length) {
  console.error('✗ لم تُفهَم استجابة Google — تغيّر شكلها؟');
  process.exit(1);
}

const field = (block, name) => (block.match(new RegExp(name + ':\\s*([^;]+);')) || [])[1]?.trim();
const out = [];
let bytes = 0;

for (const [, subset, block] of blocks) {
  if (!KEEP.has(subset)) continue;
  const url = (block.match(/url\((https:[^)]+)\)/) || [])[1];
  const family = field(block, 'font-family').replace(/['"]/g, '');
  const weight = field(block, 'font-weight') ?? '400';
  const style = field(block, 'font-style') ?? 'normal';
  const range = field(block, 'unicode-range');

  const name = `${family.replace(/\s+/g, '')}-${weight.replace(/\s+/g, '_')}-${subset}.woff2`;
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  await writeFile(join(outDir, name), buf);
  bytes += buf.length;

  out.push(
    `@font-face {\n` +
      `  font-family: '${family}';\n` +
      `  font-style: ${style};\n` +
      `  font-weight: ${weight};\n` +
      `  font-display: swap;\n` +
      `  src: url('./${name}') format('woff2');\n` +
      (range ? `  unicode-range: ${range};\n` : '') +
      `}`
  );
  console.log(`  ${name}  ${(buf.length / 1024).toFixed(1)}ك`);
}

await writeFile(
  join(outDir, 'fonts.css'),
  `/* مستضافٌ محلياً — لا شبكة عند التشغيل. يُولَّد بـ tools/fonts.mjs. */\n\n` +
    out.join('\n\n') +
    '\n'
);

console.log(`✓ ${out.length} كتلة · ${(bytes / 1024).toFixed(0)} كيلوبايت · ${outDir}/fonts.css`);
