#!/usr/bin/env node
/**
 * يصوّر ملفّ HTML أو SVG محلياً إلى PNG بمقاسٍ مضبوط — عبر Chrome بلا واجهة.
 *
 *   node tools/shot.mjs <in.html> <out.png> <w> <h>
 *
 * ويُستورَد أيضاً: `import { shot } from '../../tools/shot.mjs'`.
 *
 * يُشغَّل عند توليد الأصول وعند فحص المظهر. **البناء نفسه لا يحتاجه**:
 * ناتجه ملفّاتٌ مُلتزَمة في `public/`.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, statSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const run = promisify(execFile);

export const chrome = () =>
  [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => existsSync(p));

/** يلتقط `src` إلى `out` بمقاس `w×h`. يعيد حجم الملفّ بالبايت. */
export async function shot(src, out, w, h, { wait = 400, opaque = false } = {}) {
  const bin = chrome();
  if (!bin) throw new Error('لا Chrome على هذا الجهاز');
  rmSync(out, { force: true });
  await run(bin, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--default-background-color=${opaque ? 'ffffffff' : '00000000'}`,
    '--force-device-scale-factor=1',
    `--virtual-time-budget=${wait}`,
    `--window-size=${w},${h}`,
    `--screenshot=${resolve(out)}`,
    /^https?:/.test(src) ? src : `file://${resolve(src)}`,
  ]);
  if (!existsSync(out)) throw new Error('لم يُنتَج ' + out);
  return statSync(out).size;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [src, out, w, h] = process.argv.slice(2);
  if (!src || !out || !w || !h) {
    console.error('الاستعمال: node tools/shot.mjs <in.html> <out.png> <w> <h>');
    process.exit(1);
  }
  const size = await shot(src, out, Number(w), Number(h));
  console.log(`  ${out}  ${w}×${h}  ${(size / 1024).toFixed(1)}ك`);
}
