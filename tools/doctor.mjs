#!/usr/bin/env node
/**
 * doctor — يفحص أن بنية المستودع وتوثيقه متطابقان، ويصلح الجداول المولَّدة.
 *
 *   node tools/doctor.mjs        فحص فقط (يخرج بـ1 عند أي خطأ)
 *   node tools/doctor.mjs --fix  يعيد توليد الجداول بين علامات doctor
 *
 * سببه: التوثيق ينحرف عن الواقع دائماً إن كان تحديثه قاعدةً يتذكّرها إنسان.
 * هنا صار فحصاً آلياً — من ينسى، يفشل عنده الفحص.
 */
import fs from 'node:fs';
import path from 'node:path';
import { checkSite } from './icons.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const FIX = process.argv.includes('--fix');
const PROBE = process.argv.includes('--probe');
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const CATEGORIES = {
  languages: { label: 'اللغات', blurb: 'لغات البرمجة — نظام الأنواع والتمثيل والتنفيذ' },
  systems:   { label: 'الأنظمة', blurb: 'ما تحت التجريد: النواة، العزل، الضمانات، الزمن' },
  networks:  { label: 'الشبكات', blurb: 'من الإشارة على السلك إلى البروتوكول' },
  web:       { label: 'الويب', blurb: 'الخادم والمتصفّح وما بينهما' },
  media:     { label: 'الوسائط', blurb: 'الصورة والصوت والفيديو: ترميزاً وصيغاً' },
  architecture: { label: 'المعمار', blurb: 'شكل المشروع: أين تُرسَم الحدود، وأي اتّجاهٍ يعبرها الاعتماد' },
};

const REQUIRED = ['slug', 'category', 'title', 'tagline', 'profile', 'status'];
const STATUSES = ['published', 'building', 'draft'];

/* ── العنوان ──
   كل منهج يسكن نطاقاً فرعياً باسم `slug` تحت نطاق واحد. **العنوان مشتقٌّ لا
   مكتوب**: من يكتبه بيده ينساه مرّةً ويخطئ فيه أخرى، ولا يُعرَف أيّهما حصل.
   و`site.host` مَخرجٌ لمنهجٍ رُفع قبل هذه القاعدة باسمٍ آخر — يُعلَن ولا يُخمَّن. */
const DOMAIN = 'nodeksa.com';
const hostOf = (m) => (m.site && m.site.host) || m.slug;
const urlOf = (m) => `https://${hostOf(m)}.${DOMAIN}`;

/* ترتيب ثابت لحقول curriculum.json — لئلّا يتنقّل الحقل المُشتقّ في الملفّ */
const ORDER = ['slug', 'category', 'title', 'tagline', 'url', 'profile', 'status', 'adopted', 'layout', 'site'];
const ordered = (o) => {
  const r = {};
  for (const k of ORDER) if (k in o) r[k] = o[k];
  for (const k of Object.keys(o)) if (!(k in r)) r[k] = o[k];
  return r;
};
const writeMeta = (p, m) => fs.writeFileSync(p, JSON.stringify(ordered(m), null, 2) + '\n');

/* ── منع الألوان الحرفية ──
   الهوية البصرية مصدرها ملفّ توكنز واحد لكل منهج. أي لون حرفيّ خارجه يكسر
   الاشتقاق بصمت، ولا يظهر إلا حين يتغيّر الثيم فلا يتبعه شيء. */
const LITERAL = /(?<![\w-])(#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\()/;
/* الشكل قرار المستورِد: منهج حادّ الحواف وآخر ناعمها.
   و`0` ليس شكلاً بل غيابُه — زاويةٌ قائمة في ضلعٍ من عنصرٍ مقسَّم لا تُقرَّر
   بتوكن، فلا تُعَدّ خرقاً. */
const shapeLiteral = (ln) => {
  const m = /border-radius:\s*([^;}]+)/.exec(ln);
  return !!m && m[1].split(/[\s/]+/).some((t) => /^[0-9.]/.test(t) && !/^0$/.test(t));
};
const EXEMPT = [/presets\//, /tokens\.css$/, /[\\/]demo[\\/]/];

function scanColors(dir, label) {
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') stack.push(f); continue; }
      if (!/\.(css|tsx?|jsx?)$/.test(e.name)) continue;
      const rel = path.relative(ROOT, f);
      if (EXEMPT.some((r) => r.test(rel))) continue;
      fs.readFileSync(f, 'utf8').split('\n').forEach((ln, i) => {
        if (LITERAL.test(ln) && !/color-mix\(/.test(ln)) err(`${rel}:${i + 1}: لون حرفيّ — ${label} يحيل ولا يعرّف`);
        if (shapeLiteral(ln)) err(`${rel}:${i + 1}: نصف قطر حرفيّ — الشكل قرار المستورِد`);
      });
    }
  }
}
if (fs.existsSync(path.join(ROOT, 'kit/src'))) scanColors(path.join(ROOT, 'kit/src'), 'العدّة');

/* ── جمع المناهج ── */
const profiles = new Set(
  fs.existsSync(path.join(ROOT, '.claude/profiles'))
    ? fs.readdirSync(path.join(ROOT, '.claude/profiles'))
        .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
        .map((f) => f.replace(/\.md$/, ''))
    : []
);

const items = [];
const cbase = path.join(ROOT, 'curricula');
const proposals = [];

for (const cat of fs.readdirSync(cbase).sort()) {
  const cd = path.join(cbase, cat);
  if (!fs.statSync(cd).isDirectory()) continue;
  if (!CATEGORIES[cat]) { err(`تصنيف غير معرّف: curricula/${cat} — أضِفه إلى CATEGORIES في doctor.mjs`); continue; }

  for (const slug of fs.readdirSync(cd).sort()) {
    const dir = path.join(cd, slug);
    if (!fs.statSync(dir).isDirectory()) continue;
    const rel = `curricula/${cat}/${slug}`;
    const mp = path.join(dir, 'curriculum.json');

    /* **مقترَح**: موضوعٌ محجوزٌ بريدمي يقول متطلّباته — إمّا مطويٌّ مادّتُه في
       `archive/`، وإمّا خطّةٌ لم تُبنَ بعد. ريدمي بلا `curriculum.json`، فليس
       منهجاً ولا يدخل الجداول، ولا يُعَدّ خطأً. */
    if (!fs.existsSync(mp)) {
      if (fs.existsSync(path.join(dir, 'README.md'))) { proposals.push(rel); continue; }
      err(`${rel}: ينقصه curriculum.json ولا README — مجلّدٌ لا يقول ما هو`);
      continue;
    }
    let m;
    try { m = JSON.parse(fs.readFileSync(mp, 'utf8')); }
    catch (e) { err(`${rel}/curriculum.json: JSON غير صالح — ${e.message}`); continue; }

    for (const f of REQUIRED) if (!m[f]) err(`${rel}: حقل ناقص في curriculum.json → ${f}`);
    if (m.slug !== slug) err(`${rel}: slug="${m.slug}" لا يطابق اسم المجلد "${slug}"`);
    if (m.category !== cat) err(`${rel}: category="${m.category}" لا يطابق التصنيف "${cat}"`);
    if (m.status && !STATUSES.includes(m.status)) err(`${rel}: status="${m.status}" غير معروف (${STATUSES.join('/')})`);
    if ('adopted' in m && typeof m.adopted !== 'boolean') err(`${rel}: adopted لا بدّ أن يكون true أو false`);
    if (m.profile && !profiles.has(m.profile)) err(`${rel}: profile="${m.profile}" لا يوجد في .claude/profiles/`);
    /* العنوان ومشروع النشر مشتقّان — يُصلحان بـ--fix ولا يُكتبان بيد */
    const wantUrl = urlOf(m);
    const wantDeploy = m.site && m.site.stack !== 'legacy' ? `t3lm-${slug}` : undefined;
    if (m.url !== wantUrl || (wantDeploy && m.site.deploy !== wantDeploy)) {
      if (FIX) {
        m.url = wantUrl;
        if (wantDeploy) m.site.deploy = wantDeploy;
        writeMeta(mp, m);
        console.log(`~ ${rel}/curriculum.json → ${wantUrl}`);
      } else {
        err(`${rel}: العنوان لا يطابق المشتقّ من slug (${wantUrl}) — شغّل --fix`);
      }
    }


    if (!fs.existsSync(path.join(dir, 'README.md'))) err(`${rel}: ينقصه README.md`);

    /* الشكل القانوني مطلوب للجديد؛ القديم يُعلن flat ويُحتمل */
    const canonical = fs.existsSync(path.join(dir, 'regions'));
    if (m.layout === 'canonical' && !canonical) err(`${rel}: layout=canonical لكن لا يوجد regions/`);
    if (m.layout !== 'canonical' && canonical) warn(`${rel}: فيه regions/ — حدّث layout إلى canonical`);
    if (m.layout !== 'canonical') warn(`${rel}: بنية قديمة (flat) — تُحوَّل عند إعادة بنائه`);

    /* جدول الاشتقاق إلزامي لأي موقع نبنيه نحن */
    const sr = path.join(dir, 'site', 'README.md');
    if (m.site && m.site.stack !== 'legacy') {
      if (!fs.existsSync(sr)) err(`${rel}/site: ينقصه README.md (جدول الاشتقاق)`);
      else if (!/جدول الاشتقاق/.test(fs.readFileSync(sr, 'utf8')))
        err(`${rel}/site/README.md: بلا جدول اشتقاق`);
    }
    if (m.site && m.site.stack === 'kit' && fs.existsSync(path.join(dir, 'site/src')))
      scanColors(path.join(dir, 'site/src'), 'المنهج');
    items.push({ ...m, rel, dir });
  }
}

/* ── هل العنوان حيّ؟ ──
   الرابط في التوثيق ادّعاء. `--probe` يفحصه بطلبٍ حقيقي ويسجّل الجواب في
   `site.live`، والفحص العادي لا يمسّ الشبكة. ما ليس حيّاً يظهر عنواناً محجوزاً
   بلا رابط — لأن رابطاً ميّتاً أسوأ من لا رابط. */
if (PROBE) {
  for (const i of items) {
    const live = await fetch(i.url, { redirect: 'follow', signal: AbortSignal.timeout(8000) })
      .then((r) => r.ok).catch(() => false);
    console.log(`  ${live ? '●' : '○'} ${i.url}`);
    if (!i.site) continue;
    if (i.site.live === live) continue;
    if (!FIX) { warn(`${i.rel}: site.live=${!!i.site.live} والواقع ${live} — شغّل --probe --fix`); continue; }
    i.site.live = live;
    const { rel, dir, ...meta } = i;
    writeMeta(path.join(dir, 'curriculum.json'), meta);
    console.log(`~ ${rel}/curriculum.json → live=${live}`);
  }
}

const siteCell = (i) =>
  i.site && i.site.live ? `[زُر ↗](${i.url})` : `\`${hostOf(i)}.${DOMAIN}\``;

/* ── الجداول المولَّدة ── */
const BADGE = { published: '✅', building: '🔨', draft: '📝' };

/* `adopted: false` يعني منهجاً موجوداً لا يتبع الخطة الحالية. يُعرَض على حدة
   في الجذر، ويحمل شارته في جدول التصنيف. */
const isOld = (i) => i.adopted === false;
const badgeOf = (i) => (isOld(i) ? '📦' : BADGE[i.status] || '');

function rootTable() {
  const out = [];
  for (const [cat, meta] of Object.entries(CATEGORIES)) {
    const list = items.filter((i) => i.category === cat && !isOld(i));
    if (!list.length) continue;
    out.push(`### ${meta.label} — \`${cat}/\``, '', `${meta.blurb}`, '', '| المنهج | الموضوع | الموقع | الحالة |', '|---|---|---|---|');
    for (const i of list)
      out.push(`| [\`${i.slug}\`](curricula/${cat}/${i.slug}) | ${i.title} | ${siteCell(i)} | ${badgeOf(i)} |`);
    out.push('');
  }

  const old = items.filter(isOld);
  if (old.length) {
    out.push(
      '### مناهج سابقة',
      '',
      'كُتبت قبل الخطة الحالية أو كانت تجريبية، فهي قائمة ولا تُبنى عليها. ولكلٍّ',
      'منها ملاحظاتٌ في [`curricula-audit.md`](archive/discussions/curricula-audit.md).',
      '',
      '| المنهج | التصنيف | الموضوع | الموقع |',
      '|---|---|---|---|'
    );
    for (const i of old)
      out.push(`| [\`${i.slug}\`](curricula/${i.category}/${i.slug}) | \`${i.category}\` | ${i.title} | ${siteCell(i)} |`);
    out.push('');
  }
  return out.join('\n');
}

function catTable(cat) {
  const list = items.filter((i) => i.category === cat);
  const prop = proposals
    .filter((r) => r.startsWith(`curricula/${cat}/`))
    .map((r) => r.split('/')[2]);
  const out = [];

  if (list.length) {
    out.push('| المنهج | الموضوع | الموقع | الأسلوب | الحالة |', '|---|---|---|---|---|');
    for (const i of list)
      out.push(`| [\`${i.slug}\`](${i.slug}) | ${i.tagline || i.title} | ${siteCell(i)} | \`${i.profile}\` | ${badgeOf(i)} |`);
  }

  /* المقترحات تُذكَر هنا وإلا اختفى الموضوع من التوثيق كأنه لم يكن */
  if (prop.length) {
    if (list.length) out.push('');
    out.push('**مقترحات** — موضوعٌ محجوزٌ بريدمي يقول متطلّباته، بلا منهجٍ بعد:', '');
    for (const s of prop) out.push(`- [\`${s}\`](${s}/README.md)`);
  }

  if (!list.length && !prop.length) out.push('**لا منهج هنا بعد** — والمتطلّبات أعلاه.');
  return out.join('\n');
}

const MARK = (k) => [`<!-- doctor:${k}:start -->`, `<!-- doctor:${k}:end -->`];

function sync(file, key, body, scaffold) {
  const p = path.join(ROOT, file);
  const [a, b] = MARK(key);
  let txt = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  if (txt === null) {
    if (!FIX) { err(`${file}: غير موجود (شغّل --fix)`); return; }
    txt = scaffold(`${a}\n${body}\n${b}`);
    fs.writeFileSync(p, txt); console.log(`+ ${file}`); return;
  }
  if (!txt.includes(a)) { err(`${file}: ينقصه علامة ${a}`); return; }
  const want = txt.replace(new RegExp(`${a}[\\s\\S]*?${b}`), `${a}\n${body}\n${b}`);
  if (want === txt) return;
  if (!FIX) { err(`${file}: الجدول لا يطابق الواقع (شغّل --fix)`); return; }
  fs.writeFileSync(p, want); console.log(`~ ${file}`);
}

sync('README.md', 'curricula', rootTable(), (t) => `# T3lm\n\n${t}\n`);

/* كلُّ تصنيفٍ موجودٍ يُزامَن — **حتى الذي غادرته مناهجه**. وتخطّي الفارغ كان
   يُبقي جدولاً يشير إلى مجلّداتٍ حُذفت، و`doctor` يقول «متطابقان». */
for (const [cat, meta] of Object.entries(CATEGORIES)) {
  if (!fs.existsSync(path.join(cbase, cat))) continue;
  sync(`curricula/${cat}/README.md`, 'list', catTable(cat), (t) =>
    `# ${meta.label}\n\n${meta.blurb}\n\n${t}\n\nالبنية والاتفاقات: [\`.claude/conventions/repo-layout.md\`](../../.claude/conventions/repo-layout.md)\n`);
}

/* ── روابط التوثيق ──
   **الرابط في التوثيق ادّعاء**، كالعنوان تماماً. ومنهجٌ يُنقَل أو يُحذَف يترك
   خلفه روابط تشير إلى لا شيء، ولا يظهر ذلك إلا حين ينقر أحدهم. */
const SKIP_DIRS = new Set(['node_modules', 'dist', '.ssr', '.runno', '.git', '.demo-dist', 'target']);
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;

function checkLinks(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      /* الأرشيف نفسه غير متتبَّع؛ ومسائلُه متتبَّعةٌ فتُفحَص */
      if (f === path.join(ROOT, 'archive')) { checkLinks(path.join(f, 'discussions')); continue; }
      checkLinks(f);
      continue;
    }
    if (!e.name.endsWith('.md')) continue;
    const rel = path.relative(ROOT, f);
    for (const m of fs.readFileSync(f, 'utf8').matchAll(LINK)) {
      const raw = m[1];
      if (/^(https?:|mailto:|#)/.test(raw)) continue;
      const t = raw.split('#')[0];
      if (!t) continue;
      if (!fs.existsSync(path.resolve(dir, t))) err(`${rel}: رابطٌ إلى لا شيء → ${raw}`);
    }
  }
}
checkLinks(ROOT);

/* ── أصول التطبيق ──
   الأيقونة ملفٌّ **موجودٌ وخاطئ**: اسمُها ومقاسها سليمان ومحتواها ركنٌ مكبَّر
   من الرسم. لا يراها فحصُ بنيةٍ ولا لقطةُ سطح مكتب، ولا تظهر إلا على شاشة هاتف
   بعد التثبيت — فتُقاس بكسلاتُها هنا. والتفصيل في `tools/icons.mjs`. */
for (const cat of fs.readdirSync(path.join(ROOT, 'curricula'), { withFileTypes: true })) {
  if (!cat.isDirectory()) continue;
  for (const c of fs.readdirSync(path.join(ROOT, 'curricula', cat.name), { withFileTypes: true })) {
    if (!c.isDirectory()) continue;
    const site = path.join(ROOT, 'curricula', cat.name, c.name, 'site');
    if (!fs.existsSync(path.join(site, 'public', 'icons'))) continue;
    for (const e of checkSite(site)) err(e.replace(ROOT + path.sep, ''));
  }
}

/* ── التقرير ── */
console.log(`\nمناهج: ${items.length} · تصنيفات: ${new Set(items.map(i => i.category)).size} · أساليب: ${[...profiles].join(', ')}`);

if (proposals.length) {
  console.log(`\nمقترحات: ${proposals.length} — موضوعٌ محجوزٌ بريدمي يقول متطلّباته`);
  for (const r of proposals) console.log(`  ${r}`);
}
if (warns.length) { console.log(`\n⚠ ${warns.length} تنبيه:`); warns.forEach((w) => console.log('  ' + w)); }
if (errors.length) { console.log(`\n✗ ${errors.length} خطأ:`); errors.forEach((e) => console.log('  ' + e)); process.exit(1); }
console.log('\n✓ البنية والتوثيق متطابقان');
