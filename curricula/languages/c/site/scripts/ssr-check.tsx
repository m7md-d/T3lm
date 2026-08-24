/**
 * فحص دخان بلا متصفّح — يصيّر كل مسار عبر renderToString.
 *
 * يلتقط: ترتيب الهوكس، والقراءة من كائنٍ غير معرَّف، والاستيراد المكسور،
 * و**غياب المحتوى المستخرَج** حين يتغيّر الماركداون فينكسر الاستخراج بصمت.
 * ولا يلتقط المظهر ولا ما يقع بالنقر — لذلك `tools/screens.mjs` بعده.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Shell } from '../src/App';
import { regions } from '../src/lib/content';
import { buildShots, tally, AUTH_ORDER } from '../src/lib/structure';
import { heroProof } from '../src/lib/hero';
import { examples, EXAMPLE_REGIONS } from '../src/lib/examples';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`✗ ${m}`); };

const render = (pathname: string) =>
  renderToString(
    <StaticRouter location={{ pathname, search: '' }}><Shell /></StaticRouter>
  );

/** لقطةٌ بعينها — `?s=` كما في go وrust */
const renderAt = (pathname: string, s: number) =>
  renderToString(
    <StaticRouter location={{ pathname, search: `?s=${s}` }}><Shell /></StaticRouter>
  );

/* ١) البنية المستخرَجة موجودة فعلاً */
if (regions.length !== 29) fail(`فصول: ${regions.length}، والمنتظَر ٢٩`);
for (const r of regions) {
  if (r.hook.length < 20) fail(`${r.num}: ادّعاؤه الافتتاحيّ ${r.hook.length} حرفاً`);
  if (!r.title) fail(`${r.num}: بلا عنوان`);
}
/* لا حقل ثابت في بطاقات الطريق — القالب يُكتشَف بالعدّ لا بالنظر */
const distinct = new Set(regions.map((r) => r.hook)).size;
if (distinct !== regions.length) fail(`ادّعاءات مكرّرة في الطريق: ${regions.length - distinct}`);

/* ٢) برهان الواجهة موجود، ونصّاه متطابقان فعلاً */
const proof = heroProof();
if (!proof) fail('لا برهانَ في الفصل صفر — الواجهة الأولى بلا قلب');
else if (proof.runs.length !== 2) fail(`البرهان بـ${proof.runs.length} تشغيلاً لا اثنين`);
else if (proof.runs[0]!.out === proof.runs[1]!.out) fail('جوابا البرهان متطابقان');

/* ٢ب) الأمثلة المحلولة: من كل إقليمٍ مطلوب مثالٌ، وكلٌّ برنامجٌ كامل ومخرَجُه.
   الأدلّة §٤: ≥ ٨٠٪ قراءةً وتتبّعاً، وهذا نصيبُ الواجهة منها. */
if (examples.length !== EXAMPLE_REGIONS.length)
  fail(`أمثلة الواجهة ${examples.length} من ${EXAMPLE_REGIONS.length} إقليماً`);
for (const e of examples) {
  if (!/\bmain\s*\(/.test(e.code)) fail(`مثال ${e.num}: ليس برنامجاً كاملاً`);
  if (!e.out.trim()) fail(`مثال ${e.num}: بلا مخرَج`);
  if (e.code.split('\n').length > 24) fail(`مثال ${e.num}: ${e.code.split('\n').length} سطراً — أطول من أن يُقرأ في الواجهة`);
}

/* ٣) عدد اللوحات وسلطاتها — يجب أن يطابق ما يفحصه tools/verify.py */
const shots = regions.flatMap((r) => buildShots(r.chapter.sections, r.num));
const counts = tally(shots);
const panels = AUTH_ORDER.reduce((n, a) => n + counts[a], 0);
if (panels !== 189) fail(`لوحات الموقع ${panels}، ولوحات الفحص ١٨٩`);
if (counts.spec === 0 || counts.ub === 0) fail('سلطةٌ كاملة غائبة عن الحصاد');

/* ٤) كل مسارٍ يُصيَّر */
const routes = ['/', ...regions.map((r) => `/r/${r.num}`), '/nope'];
for (const path of routes) {
  try {
    const html = render(path);
    if (html.length < 500) throw new Error(`ناتج قصير (${html.length})`);
  } catch (e) {
    fail(`${path} — ${(e as Error).message}`);
  }
}
console.log(`✓ ${routes.length} مساراً صُيِّرت`);

/* ٥) الخطّ الأحاديّ لا يمسّ العربية — يُفحَص على الناتج لا على النيّة.
   والوسوم الصغيرة هي الضحية المعتادة، فلا تُكتشَف بالقراءة. */
for (const path of ['/', '/r/02', '/r/07', '/r/23']) {
  const html = render(path);
  for (const m of html.matchAll(/<(?!pre\b|code\b)[a-z]+[^>]*class="[^"]*\ben\b[^"]*"[^>]*>([^<]*)</g))
    if (/[؀-ۿ]/.test(m[1] ?? '')) fail(`${path}: عربيةٌ داخل وسم en — «${m[1]}»`);
}

/* ٦) لا ماركداون خام يصل القارئ */
for (const path of routes) {
  const prose = render(path)
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<code[\s\S]*?<\/code>/g, '');
  const m = prose.match(/\*\*[^*<]{2,40}\*\*/) ?? prose.match(/`[^`<]{1,40}`/);
  if (m) fail(`${path}: ماركداون خام في الناتج — «${m[0]}»`);
}

/* ٧) البوّابة لا تكشف قبل التوقّع — ولا يوجد في الموقع زرٌّ يكشف الكلّ */
{
  const gates = shots.flatMap((s) => s.blocks).filter((b) => b.type === 'gate');
  if (!gates.length) fail('لا بوّابةَ واحدة، والفصل صفر يجعل التوقّع قاعدةَ الدراسة');
  const html = renderAt('/r/02', 6);
  if (!/gate-input/.test(html)) fail('بوّابة ٠٢ لا تعرض حقل التوقّع');
  const g = gates[0] as { output: string };
  if (html.includes(g.output.split('\n')[0]!)) fail('البوّابة تكشف مخرَجها قبل التوقّع');
}

console.log(bad ? `\n✗ ${bad} عطباً` : '\n✓ الدخان نظيف');
process.exit(bad ? 1 : 0);
