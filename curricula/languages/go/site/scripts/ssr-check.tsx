/**
 * فحص دخان بلا متصفّح — يصيّر كل مسار عبر renderToString.
 *
 * يلتقط: ترتيب الهوكس، والقراءة من كائنٍ غير معرَّف، والاستيراد المكسور،
 * و**غياب المحتوى المستخرَج** حين يتغيّر الماركداون فينكسر الاستخراج بصمت.
 * ولا يلتقط المظهر ولا ما يقع بالنقر.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Shell } from '../src/App';
import { regions, AXIOMS } from '../src/lib/content';
import { buildStations } from '../src/lib/structure';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`✗ ${m}`); };

/* ١) البنية المستخرَجة موجودة فعلاً */
if (regions.length !== 13) fail(`فصول: ${regions.length}، والمنتظَر ١٣`);
if (AXIOMS.length !== 5) fail(`بديهيات: ${AXIOMS.length} لا ٥`);
for (const a of AXIOMS) {
  if (a.body.split(/\s+/).length < 40) fail(`البديهية ${a.n}: شرحها ${a.body.split(/\s+/).length} كلمة`);
  if (a.falls.length === 0) fail(`البديهية ${a.n}: بلا «ما يتساقط منها»`);
  if (a.shot < 0) fail(`البديهية ${a.n}: لا لقطة لها في الفصل ٠٠`);
}
for (const r of regions) {
  if (r.hook.length < 20) fail(`الفصل ${r.num}: ادّعاؤه الافتتاحيّ ${r.hook.length} حرفاً`);
}
/* ٢) لا حقل ثابت في بطاقات الخريطة — القالب يُكتشَف بالعدّ لا بالنظر */
const distinct = new Set(regions.map((r) => r.hook)).size;
if (distinct !== regions.length) fail(`ادّعاءات مكرّرة: ${regions.length - distinct}`);

/* ٣) كل مسارٍ يُصيَّر */
const routes = ['/', ...regions.map((r) => `/r/${r.num}`), '/r/00?s=12', '/nope'];
for (const path of routes) {
  const [pathname, search] = path.split('?');
  try {
    const html = renderToString(
      <StaticRouter location={{ pathname: pathname!, search: search ? `?${search}` : '' }}>
        <Shell />
      </StaticRouter>
    );
    if (html.length < 500) throw new Error(`ناتج قصير (${html.length})`);
    console.log(`✓ ${path.padEnd(14)} ${html.length.toLocaleString('en-US')} حرف`);
  } catch (e) {
    fail(`${path} — ${(e as Error).message}`);
  }
}

/* ٤) الخطّ الأحاديّ لا يمسّ العربية — يُفحَص على الناتج لا على النيّة.
   والوسوم الصغيرة هي الضحية المعتادة، فلا تُكتشَف بالقراءة. */
for (const path of ['/', '/r/02', '/r/07']) {
  const html = renderToString(
    <StaticRouter location={{ pathname: path, search: '' }}><Shell /></StaticRouter>
  );
  for (const m of html.matchAll(/<(?!pre\b|code\b)[a-z]+[^>]*class="[^"]*\ben\b[^"]*"[^>]*>([^<]*)</g))
    if (/[\u0600-\u06FF]/.test(m[1] ?? '')) fail(`${path}: عربيةٌ داخل وسم en — «${m[1]}»`);
}

/* ٥) لا ماركداون خام يصل القارئ — العنوان المستخرَج يُعرَض مصرَّفاً */
for (const path of routes) {
  const [pathname, search] = path.split('?');
  const html = renderToString(
    <StaticRouter location={{ pathname: pathname!, search: search ? `?${search}` : '' }}><Shell /></StaticRouter>
  );
  const prose = html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');
  const m = prose.match(/\*\*[^*<]{2,40}\*\*/) ?? prose.match(/`[^`<]{1,40}`/);
  if (m) fail(`${path}: ماركداون خام في الناتج — «${m[0]}»`);
}

/* ٦) «ما توقّعتَه» يظهر متى وُجد توقّع — بمخزنٍ مزروع لا بالنيّة */
{
  const gate = regions
    .flatMap((r) => buildStations(r.chapter.sections, r.num).flatMap((s) => s.blocks))
    .find((b) => b.type === 'gate') as { id: string } | undefined;
  if (!gate) fail('لا بوّابةَ واحدة في المنهج');
  else {
    const seeded = { predictions: { [gate.id]: 'ثلاث كلمات' }, seen: [], lastRegion: null, lastShot: {} };
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => (k === 't3lm:go' ? JSON.stringify(seeded) : null),
      setItem: () => {},
    };
    const html = renderToString(
      <StaticRouter location={{ pathname: '/', search: '' }}><Shell /></StaticRouter>
    );
    if (!/class="gap"/.test(html)) fail('«ما توقّعتَه» لا يظهر مع وجود توقّع');
    if (!html.includes('ثلاث كلمات')) fail('«ما توقّعتَه» لا يعرض نصّ التوقّع');
    delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}

console.log(bad ? `\n✗ ${bad} خطأ` : `\n✓ ${routes.length} مساراً · ${regions.length} فصلاً · ${AXIOMS.length} بديهيات`);
process.exit(bad ? 1 : 0);
