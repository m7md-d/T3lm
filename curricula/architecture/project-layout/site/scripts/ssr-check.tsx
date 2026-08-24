/**
 * فحص دخان بلا متصفّح — يصيّر كل مسار، ويفحص **المحتوى** لا التصيير وحده.
 *
 * والمفحوص هنا ما ينكسر بصمت حين يتغيّر الماركداون: جدول الطريق، وتحليل كتل
 * `layout`، واقتران «يستفيد/مضادّ»، وقراءةُ اللوحات إلى مقاييس.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Shell } from '../src/App';
import { CHANGES, PRINCIPLES, ROAD, measured, readReport, regions, sealed, shotsOf } from '../src/lib/content';
import { buildShots } from '../src/lib/structure';
import { ROLES } from '../src/lib/layout';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`✗ ${m}`); };

/* ١) الطريق في README هو المرجع — ولا فصل في `regions/` خارجه ولا العكس */
if (ROAD.length === 0) fail('جدول الطريق لم يُستخرَج من README');
for (const r of regions)
  if (!ROAD.some((s) => s.num === r.num)) fail(`الفصل ${r.num} ليس في جدول الطريق`);
if (regions.length + sealed.length !== ROAD.length)
  fail(`الطريق ${ROAD.length}، والمكتوب ${regions.length}، والمختوم ${sealed.length}`);

/* ٢) المبادئ والتغييرات تُقرأ من README، ولا تُكتب في الكود */
if (PRINCIPLES.length !== 5) fail(`مبادئ: ${PRINCIPLES.length}، والمنتظَر ٥`);
if (CHANGES.length !== 5) fail(`تغييرات: ${CHANGES.length}، والمنتظَر ٥`);

/* ٣) كل كتلة `layout` تُحلَّل، وأدوارها داخل السبعة، وكل مرجعٍ معرَّف */
if (measured.length < 12) fail(`هياكل: ${measured.length}، والمنتظَر ١٢ فأكثر`);
for (const m of measured) {
  const l = m.layout;
  if (!l.id) fail('هيكلٌ بلا معرّف');
  if (!l.nodes.length) fail(`${l.id}: بلا ملفّات`);
  for (const n of l.nodes) {
    if (!ROLES.includes(n.role)) fail(`${l.id}: دورٌ غير معروف «${n.role}» في ${n.path}`);
    for (const d of n.deps)
      if (!l.nodes.some((x) => x.path === d)) fail(`${l.id}: ${n.path} يستورد ${d} وهو غير معرَّف`);
  }
  if (!m.report) fail(`${l.id}: بلا لوحة`);
  else if (!readReport(m.report)) fail(`${l.id}: لوحةٌ لا تُقرأ إلى مقاييس`);
}

/* ٤) «يستفيد» لا تأتي بلا «مضادّ» — وهما حجّةٌ واحدة */
let pairs = 0;
for (const r of regions) {
  const titles = r.chapter.sections.map((s) => s.title);
  const good = titles.filter((t) => /^مشروعٌ يستفيد/.test(t)).length;
  const anti = titles.filter((t) => /^ومثالٌ مضادّ/.test(t)).length;
  if (good !== anti) fail(`${r.num}: «يستفيد» ${good} و«مضادّ» ${anti}`);
  pairs += good;
  for (let i = 0; i < titles.length; i++)
    if (/^مشروعٌ يستفيد/.test(titles[i]!) && !/^ومثالٌ مضادّ/.test(titles[i + 1] ?? ''))
      fail(`${r.num}: «يستفيد» لا يليها «مضادّ» مباشرةً`);
}
if (pairs < 11) fail(`أزواج يستفيد/مضادّ: ${pairs}، والمنتظَر ١١ فأكثر`);

/* ٤ب) البوّابات تُصيَّر فعلاً — وقد سقطت مرّةً بصمت حين دسّ `marked` بلوك
   `space` بين «المخرَج:» واللوحة، فلم يعد أيٌّ منها بوّابة. */
let gates = 0;
for (const r of regions)
  for (const sh of buildShots(r.chapter.sections, r.num))
    for (const b of sh.blocks) if (b.type === 'gate') gates++;
const written = regions.reduce(
  (n, r) => n + r.chapter.sections.reduce(
    (m, s) => m + (s.raw.match(/^\*{0,2}المخرَج\*{0,2}\s*:\s*$/gm) || []).length, 0), 0);
if (gates !== written) fail(`بوّابات: ${gates} مصيَّرة و${written} مكتوبة`);

/* ٥) لا فصلين بنفس الادّعاء الافتتاحيّ */
if (new Set(regions.map((r) => r.hook)).size !== regions.length) fail('ادّعاءات مكرّرة');

/* ٦) كل مسارٍ يُصيَّر */
const routes = ['/', ...regions.map((r) => `/r/${r.num}`), '/r/05?s=3', '/nope'];
for (const path of routes) {
  const [pathname, search] = path.split('?');
  try {
    const html = renderToString(
      <StaticRouter location={{ pathname: pathname!, search: search ? `?${search}` : '' }}>
        <Shell />
      </StaticRouter>
    );
    if (html.length < 500) throw new Error(`ناتج قصير (${html.length})`);
    console.log(`✓ ${path.padEnd(12)} ${html.length.toLocaleString('en-US')} حرف`);
  } catch (e) {
    fail(`${path} — ${(e as Error).message}`);
  }
}

/* ٧) الشكل ولوحته يُصيَّران في صفحة الفصل — وهما مكوّنا هذا الموقع */
{
  const html = renderToString(
    <StaticRouter location={{ pathname: '/r/02', search: '?s=1' }}><Shell /></StaticRouter>
  );
  if (!/class="layout"/.test(html)) fail('لقطة «الشكل» بلا شجرة');
  if (!/class="score"/.test(html)) fail('لقطة «الشكل» بلا لوحة مقاييس');
  if (!/class="en"/.test(html)) fail('لا وسمَ لاتينيّ معزول');
}

/* ٨) الخطّ الأحاديّ لا يمسّ العربية — يُفحَص على الناتج لا على النيّة */
for (const path of ['/', '/r/02?s=1', '/r/09?s=4']) {
  const [pathname, search] = path.split('?');
  const html = renderToString(
    <StaticRouter location={{ pathname: pathname!, search: search ? `?${search}` : '' }}><Shell /></StaticRouter>
  );
  /* الكود والمخرَج يحملان نصّاً عربياً بحقّ — حرفيّةٌ في مقطع أو لوحةٌ عربية.
     والمقصود هنا **الوسوم الصغيرة**: kicker وtag وlabel وstat. */
  for (const m of html.matchAll(/<(?!pre\b|code\b)[a-z]+[^>]*class="[^"]*\ben\b[^"]*"[^>]*>([^<]*)</g))
    if (/[\u0600-\u06FF]/.test(m[1] ?? '')) fail(`${path}: عربيةٌ داخل وسم en — «${m[1]}»`);
}

/* ١١) «ما توقّعتَه» يظهر متى وُجد توقّع — يُختبَر بمخزنٍ مزروع لا بالنيّة */
{
  const gate = regions
    .flatMap((r) => shotsOf(r).flatMap((s) => [...s.blocks, ...(s.pair?.blocks ?? [])]))
    .find((b) => b.type === 'gate') as { id: string } | undefined;
  if (!gate) fail('لا بوّابةَ واحدة في المنهج');
  else {
    const seeded = { predictions: { [gate.id]: 'ستّة ملفّات' }, seen: [], lastRegion: null, lastShot: {} };
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => (k === 't3lm:project-layout' ? JSON.stringify(seeded) : null),
      setItem: () => {},
    };
    const html = renderToString(
      <StaticRouter location={{ pathname: '/', search: '' }}><Shell /></StaticRouter>
    );
    if (!/class="gap"/.test(html)) fail('«ما توقّعتَه» لا يظهر مع وجود توقّع');
    if (!html.includes('ستّة ملفّات')) fail('«ما توقّعتَه» لا يعرض نصّ التوقّع');
    delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}

/* ١٠) لا ماركداون خام يصل القارئ — الخلية المستخرَجة من جدولٍ تُعرَض مصرَّفة */
for (const path of routes) {
  const [pathname, search] = path.split('?');
  const html = renderToString(
    <StaticRouter location={{ pathname: pathname!, search: search ? `?${search}` : '' }}><Shell /></StaticRouter>
  );
  /* الكود يحمل `**` بحقّ (مؤشّرٌ في C مثلاً)، فيُنزَع قبل الفحص. */
  const prose = html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');
  const m = prose.match(/\*\*[^*<]{2,40}\*\*/) ?? prose.match(/`[^`<]{1,40}`/);
  if (m) fail(`${path}: ماركداون خام في الناتج — «${m[0]}»`);
}

/* ٩) الاقتباس المصدريّ يأخذ اتّجاهه من نصّه لا من موضعه */
{
  const html = renderToString(
    <StaticRouter location={{ pathname: '/r/02', search: '' }}><Shell /></StaticRouter>
  );
  const src = [...html.matchAll(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/g)];
  for (const [, attrs, body] of src) {
    const arabic = /[\u0600-\u06FF]/.test(body ?? '');
    if (!arabic && !/dir="ltr"/.test(attrs ?? '')) fail('اقتباسٌ إنجليزيّ بلا اتّجاه صريح');
    if (arabic && /dir="ltr"/.test(attrs ?? '')) fail('اقتباسٌ عربيّ بُدِّل اتّجاهه');
  }
}

const shots = regions.reduce((n, r) => n + buildShots(r.chapter.sections, r.num).length, 0);
console.log(bad
  ? `\n✗ ${bad} خطأ`
  : `\n✓ ${routes.length} مساراً · ${regions.length} من ${ROAD.length} فصلاً · ${shots} لقطة · ${measured.length} هيكلاً`);
process.exit(bad ? 1 : 0);
