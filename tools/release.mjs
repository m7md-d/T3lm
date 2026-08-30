#!/usr/bin/env node
/**
 * release — يفحص الموقع ويبنيه ويضغطه جاهزاً للرفع.
 *
 *   node tools/release.mjs                 كل المواقع
 *   node tools/release.mjs <site-dir> ...  مواقع بعينها
 *   node tools/release.mjs --full          ومعها فحوص المحتوى (outputs · bidi · verify)
 *   node tools/release.mjs --no-checks     البناء والضغط وحدهما
 *
 * سببه: الأمر كان نصّاً في كل `site/README.md` يُنسَخ بيد — تسعة مواقع، وكل
 * واحدٍ يُنسى فيه فحصٌ أو يُضغط من فوق `dist/` بدل داخله. والفحص الأخير هنا هو
 * **قراءة المضغوط نفسه**: `index.html` في جذره أو لا يُسلَّم.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const FULL = argv.includes('--full');
const NO_CHECKS = argv.includes('--no-checks');
const args = argv.filter((a) => !a.startsWith('--'));

/* الترتيب مقصود: ما يسبق البناء أوّلاً، و`swcheck` بعده لأنه يخدم `dist/` */
const BEFORE = ['icons', ...(FULL ? ['outputs', 'bidi', 'verify'] : []), 'smoke'];
const AFTER = ['swcheck'];

const dirs = (p) => readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const sites = args.length ? args : dirs(join(ROOT, 'curricula')).flatMap((cat) =>
  dirs(join(ROOT, 'curricula', cat))
    .map((s) => join('curricula', cat, s, 'site'))
    .filter((d) => existsSync(join(ROOT, d, 'package.json'))
                && JSON.parse(readFileSync(join(ROOT, d, 'package.json'), 'utf8')).scripts?.build));

const kb = (n) => (n / 1024).toFixed(0).padStart(5) + 'ك';
const failed = [];
const skipped = [];

for (const rel of sites) {
  const site = resolve(ROOT, rel);
  const meta = JSON.parse(readFileSync(join(site, '..', 'curriculum.json'), 'utf8'));
  const scripts = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8')).scripts ?? {};
  const have = (n) => Object.hasOwn(scripts, n);
  console.log(`\n\x1b[1m${meta.slug}\x1b[0m  ${meta.title}`);

  /* بلا مشروع رفعٍ في `curriculum.json` لا وجهةَ للمضغوط — يُعلَن ولا يُبنى */
  if (!args.length && !meta.site?.deploy) {
    console.log('  \x1b[2m— بلا مشروع رفع، يُتخطّى\x1b[0m');
    skipped.push(meta.slug);
    continue;
  }

  const step = async (name) => {
    process.stdout.write(`  ${name.padEnd(10)} `);
    try {
      await run('npm', ['run', name, '--silent'], { cwd: site, maxBuffer: 64 * 1024 * 1024 });
      console.log('✓');
      return true;
    } catch (e) {
      console.log('✗');
      const out = ((e.stdout ?? '') + (e.stderr ?? '')).trimEnd().split('\n').slice(-12);
      out.forEach((l) => console.log('      ' + l));
      failed.push(`${meta.slug} · ${name}`);
      return false;
    }
  };

  let ok = true;
  if (!NO_CHECKS) for (const s of BEFORE) if (have(s) && ok) ok = await step(s);
  if (ok) ok = await step('build');
  if (ok && !NO_CHECKS) for (const s of AFTER) if (have(s) && ok) ok = await step(s);
  if (!ok) continue;

  /* الضغط **من داخل `dist/`**: جذر المضغوط يصير جذر الموقع، ومجلّدٌ واحدٌ في
     الجذر يُسكِن الموقع تحت `/dist/` ويعطي الجذر ٤٠٤ */
  const zip = join(site, `${meta.slug}.zip`);
  rmSync(zip, { force: true });
  await run('zip', ['-qr', zip, '.', '-x', '.DS_Store', '**/.DS_Store', '__MACOSX/*'],
    { cwd: join(site, 'dist') });

  const list = (await run('unzip', ['-l', zip])).stdout;
  const names = list.split('\n').slice(3, -3).map((l) => l.slice(30).trim()).filter(Boolean);
  if (!names.includes('index.html')) {
    console.log('  \x1b[31m✗ لا index.html في جذر المضغوط — يُسكِن الموقع تحت مجلّد\x1b[0m');
    failed.push(`${meta.slug} · جذر المضغوط`);
    continue;
  }
  const big = names.map((n) => [n, statSync(join(site, 'dist', n)).size]).filter(([, s]) => s > 25 * 1024 * 1024);
  for (const [n, s] of big) {
    console.log(`  \x1b[31m✗ ${n} ${kb(s)} — فوق حدّ الملفّ الواحد ٢٥م\x1b[0m`);
    failed.push(`${meta.slug} · ${n} فوق الحدّ`);
  }
  console.log(`  ${'zip'.padEnd(10)} ✓  ${kb(statSync(zip).size)} · ${names.length} ملفّاً`);
  console.log(`  ${'رفعٌ إلى'.padEnd(9)} ${meta.site?.deploy || '—'}  ⇒  ${meta.url ?? ''}`);
}

console.log();
if (failed.length) {
  console.log(`\x1b[31m✗ ${failed.length} فشل:\x1b[0m`);
  failed.forEach((f) => console.log('  ' + f));
  process.exit(1);
}
console.log(`✓ ${sites.length - skipped.length} موقعاً: فُحص وبُني وضُغط، و\`index.html\` في جذر كل مضغوط`);
if (skipped.length) console.log(`  وتُخطّي ${skipped.length}: ${skipped.join(' · ')} — بلا مشروع رفع`);
