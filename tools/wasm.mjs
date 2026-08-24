#!/usr/bin/env node
/**
 * يستضيف سلسلة أدوات runno محلياً **مضغوطةً**.
 *
 *   node tools/wasm.mjs <site-dir>
 *
 * لماذا محلياً: تشغيل WASI يحتاج `SharedArrayBuffer`، وهو لا يوجد إلا مع عزل
 * الأصول (COOP/COEP) — والعزلُ نفسه يمنع جلبَ ملفٍّ من `runno.dev` لأنها لا
 * تعلن `Cross-Origin-Resource-Policy`. فالاستضافة الذاتية شرطُ إمكانٍ لا خيار.
 *
 * ولماذا مضغوطةً: `clang.wasm` ثلاثون ميغابايت، وهو فوق حدّ الملفّ الواحد عند
 * أكثر المستضيفين الساكنين. وgzip يردّه إلى عشرة، ويفكّه المتصفّح بنفسه عبر
 * `DecompressionStream` — بلا مكتبة.
 *
 * المخرَج: <site-dir>/public/wasm/*.wasm.gz — **يُلتزَم في المستودع**،
 * فالبناء لا يحتاج شبكة، وهذا وحده يحتاجها.
 */
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createWriteStream, statSync } from 'node:fs';

const site = process.argv[2];
if (!site) {
  console.error('الاستعمال: node tools/wasm.mjs <site-dir>');
  process.exit(1);
}

/** ما تطلبه سلسلة C في runno. غيرُها لغاتٌ لا يعرضها هذا المنهج.
 *  و`clang-fs.tar.gz` هو الـsysroot — ترويسات المكتبة القياسية. بلا `stdio.h`
 *  لا ترجمة، وهو مضغوطٌ أصلاً فيُنسَخ كما هو. */
const PARTS = ['clang.wasm', 'wasm-ld.wasm'];
const ASIS = ['clang-fs.tar.gz'];
const BASE = 'https://runno.dev/langs/';

const out = join(site, 'public', 'wasm');
await mkdir(out, { recursive: true });
for (const f of await readdir(out).catch(() => [])) await unlink(join(out, f));

let total = 0;
for (const name of PARTS) {
  const res = await fetch(BASE + name);
  if (!res.ok) { console.error(`✗ ${name}: ${res.status}`); process.exit(1); }
  const dest = join(out, `${name}.gz`);
  await pipeline(Readable.fromWeb(res.body), createGzip({ level: 9 }), createWriteStream(dest));
  const n = statSync(dest).size;
  total += n;
  console.log(`  ${`${name}.gz`.padEnd(20)} ${(n / 1048576).toFixed(1)} ميغابايت`);
}

for (const name of ASIS) {
  const res = await fetch(BASE + name);
  if (!res.ok) { console.error(`✗ ${name}: ${res.status}`); process.exit(1); }
  const dest = join(out, name);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  const n = statSync(dest).size;
  total += n;
  console.log(`  ${name.padEnd(20)} ${(n / 1048576).toFixed(1)} ميغابايت`);
}

console.log(`✓ ${PARTS.length + ASIS.length} ملفّاً · ${(total / 1048576).toFixed(1)} ميغابايت في public/wasm`);
