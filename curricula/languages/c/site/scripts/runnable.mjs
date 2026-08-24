#!/usr/bin/env node
/**
 * **زرّ التشغيل ادّعاءٌ يُفحَص** (الثابت ١).
 *
 * يشغّل كل بلوكٍ مرشَّحٍ في متصفّحٍ حقيقيّ بـclang المترجَم إلى WebAssembly،
 * ويقارن مخرَجه بالمسجَّل في الماركداون، ثم يكتب **بصمات ما طابق** في
 * `src/lib/runnable.json`. وما لم يطابق لا زرَّ له، مهما كانت سلطته.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';

const run = promisify(execFile);
const { stdout } = await run('node', [
  '../../../../tools/dump.mjs', '.runno', 'runno-check.html', '1800000',
], { maxBuffer: 1 << 26 }).catch((e) => ({ stdout: e.stdout ?? '' }));

console.log(stdout.split('--- runnable.json ---')[0].trim());

const raw = stdout.split('--- runnable.json ---')[1]?.trim();
if (!raw) { console.error('✗ لم تُنتِج الصفحة قائمةً'); process.exit(1); }

const ids = JSON.parse(raw);
await writeFile('src/lib/runnable.json', JSON.stringify(ids, null, 0) + '\n');
console.log(`\n✓ ${ids.length} بلوكاً له زرُّ تشغيل — كُتبت في src/lib/runnable.json`);
