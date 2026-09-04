/**
 * فحص التطابق — **الشرط الذي يسمح بوجود زرّ تشغيل أصلاً.**
 *
 * المنفّذ في المتصفّح ليس الأداة الحقيقية، والفرق لا يُخمَّن. فهذا الفحص يشغّل
 * نقل TypeScript (`src/lib/dsl.ts` · `model.ts` · `emit.ts`) على حزمتَي
 * `examples/` نفسِهما، ويقارن:
 *
 *   ١) الصالحُ يُقبَل، والفاسدُ يُرفَض
 *   ٢) **نصُّ الرفض وموضعُه** حرفاً بحرف مقابل `.expected` التي كتبتها Python
 *   ٣) الشكل القانونيّ `dump(build(s))` مقابل مخرَج Python لنفس الملفّ
 *
 * وأيُّ حرفٍ يختلف يُفشِل البناء. فإن سقط هذا الفحص فالحلُّ حذفُ المختبر لا
 * تعديلُ المتوقَّع (الثابت ١).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DslError } from '../src/lib/dsl';
import { build } from '../src/lib/model';
import { dump } from '../src/lib/emit';

const ROOT = new URL('../..', import.meta.url).pathname;
const EX = join(ROOT, 'examples');

const list = (dir: string) =>
  readdirSync(join(EX, dir)).filter((f) => f.endsWith('.dsl')).sort()
    .map((f) => ({ name: f, path: join(EX, dir, f) }));

let bad = 0;
const fail = (m: string) => { console.error(`✗ ${m}`); bad++; };

/* ١ + ٣ — الصالح */
const good = list('valid');
const canon = pythonDump(good.map((g) => g.path));
for (const g of good) {
  const src = readFileSync(g.path, 'utf8');
  try {
    const got = dump(build(src));
    if (got !== canon[g.path]) {
      fail(`${g.name}: الشكل القانونيّ يخالف Python\n--- Python\n${canon[g.path]}--- TypeScript\n${got}`);
    }
  } catch (e) {
    const r = e instanceof DslError ? e.report() : String(e);
    fail(`${g.name}: صالحٌ ورُفض\n${r}`);
  }
}

/* ٢ — الفاسد، بنصّ رفضه */
const evil = list('invalid');
for (const b of evil) {
  const src = readFileSync(b.path, 'utf8');
  const want = readFileSync(b.path.replace(/\.dsl$/, '.expected'), 'utf8').replace(/\n+$/, '');
  let got: string | null = null;
  try {
    build(src);
  } catch (e) {
    if (!(e instanceof DslError)) { fail(`${b.name}: رفضٌ بلا موضع — ${String(e)}`); continue; }
    got = e.report();
  }
  if (got === null) { fail(`${b.name}: فاسدٌ وقُبل`); continue; }
  if (got !== want) fail(`${b.name}: نصُّ الرفض يخالف Python\n--- متوقَّع\n${want}\n--- وقع\n${got}`);
}

console.log(`نقلُ اللغة: صالحةٌ قُبلت ${good.length - bad0(bad)}/${good.length} · فاسدةٌ رُفضت بنصّها ${evil.length}/${evil.length}`);
if (bad) { console.error(`${bad} اختلافاً بين المتصفّح وPython — لا زرَّ تشغيل حتى تُسدّ`); process.exit(1); }
console.log('✓ المتصفّح يعطي ما تعطيه Python: النصّ والسطر والعمود');

function bad0(n: number) { return n > good.length ? good.length : n; }

/** الشكل القانونيّ من Python نفسها — لا من ذاكرةٍ ولا من ملفٍّ مسجَّل. */
function pythonDump(paths: string[]): Record<string, string> {
  const code = [
    'import sys, json, pathlib',
    `sys.path.insert(0, ${JSON.stringify(join(ROOT, 'programs'))})`,
    'from model import build',
    'from emit import dump',
    'out = {p: dump(build(pathlib.Path(p).read_text(encoding="utf-8"))) for p in sys.argv[1:]}',
    'print(json.dumps(out, ensure_ascii=False))',
  ].join('\n');
  const raw = execFileSync('python3', ['-c', code, ...paths], { encoding: 'utf8' });
  return JSON.parse(raw) as Record<string, string>;
}
