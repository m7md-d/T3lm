/**
 * فحص دخان بلا متصفّح — يصيّر كل مسار عبر renderToString.
 *
 * يلتقط: ترتيب الهوكس، والقراءة من كائنٍ غير معرَّف، والاستيراد المكسور،
 * و**غياب المحتوى المستخرَج** حين يتغيّر الماركداون فينكسر الاستخراج بصمت.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Shell } from '../src/App';
import { regions, ROAD, sealed, AXIOMS, TOOLCHAIN } from '../src/lib/content';
import { buildStations } from '../src/lib/structure';
import { highlightToHtml } from '@t3lm/kit/highlight/rust';

let bad = 0;
const fail = (m: string) => { bad++; console.log(`✗ ${m}`); };

/* ١) البنية المستخرَجة موجودة فعلاً */
/* الطريق في README هو المرجع — ولا فصل في `regions/` خارجه ولا العكس */
if (ROAD.length === 0) fail('جدول الطريق لم يُستخرَج من README');
for (const r of regions)
  if (!ROAD.some((s) => s.num === r.num)) fail(`الفصل ${r.num} ليس في جدول الطريق`);
if (regions.length + sealed.length !== ROAD.length)
  fail(`الطريق ${ROAD.length}، والمكتوب ${regions.length}، والمختوم ${sealed.length}`);
if (AXIOMS.length !== 5) fail(`بديهيات: ${AXIOMS.length}، والمنتظَر ٥`);
if (!/rustc/.test(TOOLCHAIN)) fail(`سلسلة الأدوات لم تُستخرَج: ${TOOLCHAIN}`);

for (const a of AXIOMS) {
  if (a.body.split(/\s+/).length < 40) fail(`البديهية ${a.n}: شرحها ${a.body.split(/\s+/).length} كلمة`);
  if (a.falls.length === 0) fail(`البديهية ${a.n}: بلا «ما يتساقط منها»`);
  if (a.shot < 0) fail(`البديهية ${a.n}: لا لقطة لها في الفصل ٠٠`);
}
/* أربعٌ من الخمس يحرسها رمزٌ صريح؛ والخامسة لا رمز واحد لها */
const guarded = AXIOMS.filter((a) => a.guards.length > 0).length;
if (guarded < 4) fail(`بديهيات بحُرّاس: ${guarded}، والمنتظَر ٤ فأكثر`);

/* ٢) بلوكات الرفض تُلتقَط بالرمز */
let rej = 0;
for (const r of regions) {
  for (const st of buildStations(r.chapter.sections, r.num)) {
    for (const b of st.blocks) {
      if (b.type === 'err') {
        rej++;
        if (!b.code) fail(`${r.num} · ${st.title}: بلوك رفضٍ بلا رمز`);
      }
    }
  }
}
if (rej < 8) fail(`بلوكات الرفض: ${rej}، والمنتظَر ٨`);

/* ٢ب) بوّابات التنبّؤ تُصيَّر فعلاً — وقد سقطت مرّةً بصمت حين دسّ `marked`
   بلوك `space` بين «المخرَج:» واللوحة، فلم يعد أيٌّ منها بوّابة. */
let gates = 0;
for (const r of regions)
  for (const st of buildStations(r.chapter.sections, r.num))
    for (const b of st.blocks) if (b.type === 'gate') gates++;
const written = regions.reduce(
  (n, r) => n + r.chapter.sections.reduce(
    (m, s) => m + (s.raw.match(/^\*{0,2}المخرَج\*{0,2}\s*:\s*$/gm) || []).length, 0), 0);
if (gates !== written) fail(`بوّابات: ${gates} مصيَّرة و${written} مكتوبة`);

/* ٣) الكود ملوَّن فعلاً — الأصناف تخرج من محلّل Rust لا من افتراض */
{
  const sample = buildStations(regions[0]!.chapter.sections, '00')
    .flatMap((st) => st.blocks)
    .find((b) => b.type === 'code');
  if (!sample || sample.type !== 'code') fail('لا بلوك كودٍ في الفصل ٠٠');
  else {
    const html = highlightToHtml(sample.code, 'rust');
    if (!/tok-keyword/.test(html)) fail('التلوين لم يُنتج أصنافاً — تحقّق من محلّل rust');
  }
}

/* ٤) لا فصلين بنفس الادّعاء الافتتاحيّ */
if (new Set(regions.map((r) => r.hook)).size !== regions.length) fail('ادّعاءات مكرّرة');

/* ٥) كل مسارٍ يُصيَّر */
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

/* ٦) الخطّ الأحاديّ لا يمسّ العربية — يُفحَص على الناتج لا على النيّة.
   والوسوم الصغيرة هي الضحية المعتادة، فلا تُكتشَف بالقراءة. */
for (const path of ['/', '/r/02', '/r/09']) {
  const html = renderToString(
    <StaticRouter location={{ pathname: path, search: '' }}><Shell /></StaticRouter>
  );
  /* الكود والمخرَج يحملان نصّاً عربياً بحقّ — حرفيّةٌ في مقطع أو لوحةٌ عربية.
     والمقصود هنا **الوسوم الصغيرة**: kicker وtag وlabel وstat. */
  for (const m of html.matchAll(/<(?!pre\b|code\b)[a-z]+[^>]*class="[^"]*\ben\b[^"]*"[^>]*>([^<]*)</g))
    if (/[\u0600-\u06FF]/.test(m[1] ?? '')) fail(`${path}: عربيةٌ داخل وسم en — «${m[1]}»`);
}

/* ٧) لا ماركداون خام يصل القارئ — الخلية المستخرَجة من جدولٍ تُعرَض مصرَّفة */
for (const path of routes) {
  const [pathname, search] = path.split('?');
  const html = renderToString(
    <StaticRouter location={{ pathname: pathname!, search: search ? `?${search}` : '' }}><Shell /></StaticRouter>
  );
  const prose = html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');
  const m = prose.match(/\*\*[^*<]{2,40}\*\*/) ?? prose.match(/`[^`<]{1,40}`/);
  if (m) fail(`${path}: ماركداون خام في الناتج — «${m[0]}»`);
}

/* ٨) «ما توقّعتَه» يظهر متى وُجد توقّع — بمخزنٍ مزروع لا بالنيّة */
{
  const gate = regions
    .flatMap((r) => buildStations(r.chapter.sections, r.num).flatMap((s) => s.blocks))
    .find((b) => b.type === 'gate') as { id: string } | undefined;
  if (!gate) fail('لا بوّابةَ واحدة في المنهج');
  else {
    const seeded = { predictions: { [gate.id]: 'يرفض المترجم' }, seen: [], lastRegion: null, lastShot: {} };
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => (k === 't3lm:rust' ? JSON.stringify(seeded) : null),
      setItem: () => {},
    };
    const html = renderToString(
      <StaticRouter location={{ pathname: '/', search: '' }}><Shell /></StaticRouter>
    );
    if (!/class="gap"/.test(html)) fail('«ما توقّعتَه» لا يظهر مع وجود توقّع');
    if (!html.includes('يرفض المترجم')) fail('«ما توقّعتَه» لا يعرض نصّ التوقّع');
    delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}

console.log(bad ? `\n✗ ${bad} خطأ` : `\n✓ ${routes.length} مساراً · ${regions.length} من ${ROAD.length} فصلاً · ${rej} بلوك رفض`);
process.exit(bad ? 1 : 0);
