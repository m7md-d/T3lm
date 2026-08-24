/**
 * مزامنة محتوى المنهج إلى داخل الموقع.
 *
 * لماذا نسخٌ لا استيرادٌ مباشر: Vite لا يستطيع استيراد ملفات خارج جذر المشروع
 * عبر `?raw` بشكلٍ موثوق. النسخ عند كل `dev`/`build` يبقي **الماركداون مصدر
 * الحقيقة الوحيد** بينما يظل البناء بسيطاً.
 *
 * تعديلٌ عن المحرّك: هذا المنهج مقسوم إلى `regions/` و`appendix/` + `README.md`،
 * فالنسخ يمشي على ثلاثة مصادر لا واحد.
 */
import { cpSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '..', '..');
const DEST = resolve(here, '..', 'src', 'content', 'md');

const SOURCES = [
  { from: SRC, to: '', pattern: /^README\.md$/ },
  { from: join(SRC, 'regions'), to: 'regions', pattern: /^\d\d-.*\.md$/ },
  { from: join(SRC, 'appendix'), to: 'appendix', pattern: /^.*\.md$/ },
];

if (!existsSync(join(SRC, 'regions'))) {
  console.warn(`⚠️  مصدر المنهج غير موجود: ${SRC} — أُبقيت النسخة الحالية.`);
  process.exit(0);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

let n = 0;
for (const s of SOURCES) {
  if (!existsSync(s.from)) continue;
  const out = s.to ? join(DEST, s.to) : DEST;
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(s.from).filter((f) => s.pattern.test(f))) {
    cpSync(join(s.from, f), join(out, f));
    n++;
  }
}

if (n === 0) {
  console.warn('⚠️  لم يُعثر على ملفات منهج.');
  process.exit(1);
}
console.log(`✓ زُومن ${n} ملفاً إلى src/content/md/`);
