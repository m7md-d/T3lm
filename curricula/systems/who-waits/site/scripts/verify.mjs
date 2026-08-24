/**
 * فحص المحتوى بلا متصفح ولا Vite — `node scripts/verify.mjs`.
 *
 * يجيب على ما يكسر الموقع صامتاً:
 *   ١) هل يتحوّل كل إقليمٍ إلى محطّاتٍ وخطوات؟ وكم صندوق 🧨؟ وهل للخلاصة بابان؟
 *   ٢) هل يطابق كل مختبر **خطوةً واحدةً بالضبط**؟ (صفرٌ = لن يظهر، أكثر = سيتكرّر.)
 *   ٣) هل تُستخرَج الأنماط الثمانية والجدول الجامع من الإقليم ٠٩؟
 *   ٤) هل كل رابطٍ داخليٍّ في المنهج يشير إلى ملفٍّ معروف؟
 *
 * سجلّ المختبرات يُقرأ من `src/widgets/index.js` نصّياً — مصدرٌ واحد لا نسختان.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRegion } from '../src/lib/stations.js';
import { extractMatrix, extractPatterns } from '../src/lib/nine.js';

const here = dirname(fileURLToPath(import.meta.url));
const MD = resolve(here, '..', 'src', 'content', 'md');
const REG = join(MD, 'regions');

let fail = 0;
const known = new Set(['README.md']);
for (const f of readdirSync(REG)) known.add(`regions/${f}`);
for (const f of readdirSync(join(MD, 'appendix'))) known.add(`appendix/${f}`);

console.log('— الأقاليم: محطّات وخطوات —');
const docs = {};
for (const f of readdirSync(REG).filter((x) => /^\d\d-.*\.md$/.test(x)).sort()) {
  const raw = readFileSync(join(REG, f), 'utf8');
  const d = buildRegion(raw);
  docs[f] = d;
  const steps = d.stations.reduce((n, s) => n + (s.steps ? s.steps.length : 0), 0);
  const blast =
    d.stations.reduce((n, s) => n + (s.blocks || []).filter((b) => b.type === 'blast').length, 0) +
    d.stations.reduce(
      (n, s) => n + (s.steps || []).reduce((m, k) => m + k.blocks.filter((b) => b.type === 'blast').length, 0),
      0
    );
  const srcBlast = (raw.match(/^>\s*🧨/gm) || []).length;
  const doors = d.stations.some((s) => s.doors);
  const last = f.startsWith('09');
  const ok = d.stations.length > 0 && d.lead.axis && blast === srcBlast && (doors || last);
  if (!ok) fail++;
  console.log(
    `${ok ? '✓' : '✗'} ${f.padEnd(20)} محطّات:${String(d.stations.length).padStart(2)}  خطوات:${String(steps).padStart(
      2
    )}  🧨:${blast}/${srcBlast}  أبواب:${doors ? '✓' : '—'}  محور:${d.lead.axis || '✗'}`
  );
}

console.log('\n— مطابقة المختبرات بخطواتها —');
const reg = readFileSync(resolve(here, '..', 'src', 'widgets', 'index.js'), 'utf8');
const specs = [...reg.matchAll(/id:\s*'([^']+)',\s*region:\s*'([^']+)',\s*after:\s*'([^']+)'/g)].map((m) => ({
  id: m[1],
  region: m[2],
  after: m[3],
}));
const fileOf = {
  ground: '00-ground.md', bytes: '01-bytes.md', 'who-waits': '02-who-waits.md', terminal: '03-terminal.md',
  'time-state': '04-time-state.md', protocol: '05-protocol.md', 'shared-state': '06-shared-state.md',
  media: '07-media.md', disk: '08-disk.md', craft: '09-craft.md',
};
for (const s of specs) {
  const d = docs[fileOf[s.region]];
  const hits = (d ? d.stations : []).flatMap((st) => (st.steps || []).filter((k) => k.title.includes(s.after)));
  const ok = hits.length === 1;
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${s.id.padEnd(14)} ${hits.length} مطابقة  ${hits[0] ? `← ${hits[0].title}` : `(${s.after})`}`);
}
if (specs.length === 0) {
  fail++;
  console.log('✗ لم يُقرأ أي مختبر من السجلّ');
}

console.log('\n— استخراج الإقليم ٠٩ —');
const nine = readFileSync(join(REG, '09-craft.md'), 'utf8');
const pats = extractPatterns(nine);
const mtx = extractMatrix(nine);
const pOk = pats.length === 8 && pats.every((p) => p.ids.length >= 2);
const mOk = mtx && mtx.head.length === 4 && mtx.body.length >= 8;
if (!pOk) fail++;
if (!mOk) fail++;
console.log(`${pOk ? '✓' : '✗'} الأنماط: ${pats.length} نمطاً، أقلّ عددٍ من الأقاليم لنمط: ${Math.min(...pats.map((p) => p.ids.length))}`);
console.log(`${mOk ? '✓' : '✗'} المصفوفة: ${mtx ? `${mtx.head.length} أعمدة × ${mtx.body.length} صفوف` : 'لم تُستخرَج'}`);

console.log('\n— الروابط الداخلية —');
let links = 0;
let broken = 0;
const files = [['README.md', readFileSync(join(MD, 'README.md'), 'utf8')]];
for (const f of readdirSync(REG)) files.push([`regions/${f}`, readFileSync(join(REG, f), 'utf8')]);
for (const f of readdirSync(join(MD, 'appendix'))) files.push([`appendix/${f}`, readFileSync(join(MD, 'appendix', f), 'utf8')]);
for (const [name, raw] of files) {
  for (const m of raw.matchAll(/\]\(([^)\s]+\.md)(#[^)\s]+)?\)/g)) {
    links++;
    const rel = m[1].replace(/^\.\.\//, '');
    const target = rel.includes('/') ? rel : name.includes('/') ? `${name.split('/')[0]}/${rel}` : rel;
    if (!known.has(target) && !known.has(rel)) {
      broken++;
      console.log(`✗ ${name} → ${m[1]}`);
    }
  }
}
console.log(`${broken === 0 ? '✓' : '✗'} ${links} رابطاً، ${broken} مكسور`);
fail += broken;

console.log(fail === 0 ? '\n✅ كل الفحوص نجحت' : `\n❌ ${fail} فشل`);
process.exit(fail ? 1 : 0);
