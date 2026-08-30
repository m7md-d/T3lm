#!/usr/bin/env node
/**
 * يفحص أصول التطبيق **بعد توليدها** — هندسةً لا وجوداً.
 *
 *   node tools/icons.mjs [<site-dir> ...]     (بلا وسيط: كل المناهج)
 *
 * ولماذا فحصٌ مستقلّ: العيب الذي كشفه ليس ملفّاً ناقصاً بل ملفّاً **موجوداً
 * وخاطئاً** — أيقونةٌ سليمة الاسم والمقاس، ومحتواها ركنٌ مكبَّر من الرسم. لا
 * يراها فحص دخانٍ ولا `doctor` ولا لقطة سطح مكتب، ولا تظهر إلا على شاشة هاتف
 * بعد التثبيت. فالفحص يقرأ البكسلات ويقيس.
 *
 * ويُقرأ الـPNG هنا بلا اعتماد: `zlib` في Node يكفي لـ٨ بت.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { join, basename } from 'node:path';

/* ── قراءة PNG ─────────────────────────────────────────────────────────── */

export function decode(file) {
  const b = readFileSync(file);
  let p = 8, w = 0, h = 0, depth = 0, ctype = 0;
  const idat = [];
  while (p + 8 <= b.length) {
    const len = b.readUInt32BE(p);
    const tag = b.toString('ascii', p + 4, p + 8);
    const data = b.subarray(p + 8, p + 8 + len);
    if (tag === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    else if (tag === 'IDAT') idat.push(data);
    else if (tag === 'IEND') break;
    p += 12 + len;
  }
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[ctype];
  if (depth !== 8 || !ch) throw new Error(`${basename(file)}: عمق ${depth} نوع ${ctype} غير مدعوم`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const px = Buffer.alloc(h * stride);
  let q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++];
    const line = raw.subarray(q, q + stride); q += stride;
    const cur = px.subarray(y * stride, (y + 1) * stride);
    const prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const bb = prev ? prev[i] : 0;
      const c = prev && i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += bb;
      else if (f === 3) v += (a + bb) >> 1;
      else if (f === 4) {
        const t = a + bb - c;
        const pa = Math.abs(t - a), pb = Math.abs(t - bb), pc = Math.abs(t - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c;
      }
      cur[i] = v & 255;
    }
  }
  return { w, h, ch, px };
}

/**
 * صندوق «الحبر»: ما يخالف لون الأركان الأربعة. ويعيد نسبه إلى مقاس الأيقونة
 * حتى يُقارَن مقاسان من نفس المصدر.
 */
export function ink(file, threshold = 24) {
  const { w, h, ch, px } = decode(file);
  const at = (x, y) => {
    const o = (y * w + x) * ch;
    return ch >= 3
      ? [px[o], px[o + 1], px[o + 2], ch === 4 ? px[o + 3] : 255]
      : [px[o], px[o], px[o], ch === 2 ? px[o + 1] : 255];
  };
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const bg = [0, 1, 2, 3].map((i) => Math.round(corners.reduce((s, c) => s + c[i], 0) / 4));

  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  let x0 = w, y0 = h, x1 = -1, y1 = -1, minAlpha = 255, far = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = at(x, y);
    if (p[3] < minAlpha) minAlpha = p[3];
    const d = Math.max(
      Math.abs((p[0] * p[3] - bg[0] * bg[3]) / 255),
      Math.abs((p[1] * p[3] - bg[1] * bg[3]) / 255),
      Math.abs((p[2] * p[3] - bg[2] * bg[3]) / 255),
      Math.abs(p[3] - bg[3]),
    );
    if (d <= threshold) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    /* البعد يُقاس على البكسل نفسه لا على ركن صندوقه: خطٌّ رأسيّ في الوسط
       صندوقُه عريض وركنُه بعيد، وهو كلُّه قريبٌ من المركز فلا يُقصّ. */
    const r = Math.hypot(x - cx, y - cy);
    if (r > far) far = r;
  }

  const empty = x1 < 0;
  return {
    w, h, empty, opaque: minAlpha === 255,
    /* أبعد بكسلٍ ملوّنٍ عن المركز ÷ المقاس — وهو ما تقصّه أقنعة أندرويد */
    radius: empty ? 0 : (far + 0.5) / w,
    /* إزاحة مركز الحبر عن مركز اللوحة: العيبُ الذي يقتطع من ركنٍ يقفز هنا */
    off: empty ? 0 : Math.hypot((x0 + x1) / 2 - cx, (y0 + y1) / 2 - cy) / w,
  };
}

/* ── الفحوص ────────────────────────────────────────────────────────────── */

/** حدُّ منطقة القصّ الآمنة للأيقونة المقنَّعة: دائرةٌ قطرها ٨٠٪ ⇒ نصف قطرٍ ٤٠٪. */
const SAFE = 0.40;
/**
 * وحدٌّ أدنى كذلك: رمزٌ صغيرٌ في لوحةٍ كبيرة يخرج ضائعاً بين أيقونات الشاشة —
 * وهو نفس شكوى «مب راكبة صح» من الجهة الأخرى. والمقنَّعة أضيق لأن القناع يقصّ.
 */
const FLOOR = { maskable: 0.26, any: 0.30 };
/** ما يُسمح به من إزاحةٍ عن المركز، وما يُسمح به من فرقٍ بين مقاسَي مصدرٍ واحد. */
const CENTER = 0.02;
const AGREE = 0.03;

export function checkSite(site) {
  const bad = [];
  const dir = join(site, 'public', 'icons');
  const say = (m) => bad.push(`${site}: ${m}`);
  if (!existsSync(dir)) return [`${site}: لا مجلّد أيقونات`];

  const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
  const m = {};
  for (const f of files) {
    const declared = /-(\d+)\.png$/.test(f) ? Number(f.match(/-(\d+)\.png$/)[1])
      : f === 'apple-touch-icon.png' ? 180 : null;
    let r;
    try { r = ink(join(dir, f)); } catch (e) { say(`${f}: ${e.message}`); continue; }
    m[f] = r;

    if (r.w !== r.h) say(`${f}: ${r.w}×${r.h} ليست مربّعة`);
    if (declared && r.w !== declared) say(`${f}: ${r.w}px والاسم يقول ${declared}`);
    if (r.empty) say(`${f}: لا رسمَ فيها — لونٌ واحد`);

    /* الشفافية تخرج سوداء على iOS، والمقنَّعة تُقصّ فتكشف ما تحتها */
    if (!r.opaque && (f.startsWith('icon-maskable') || f === 'apple-touch-icon.png')) {
      say(`${f}: فيها شفافية — تخرج سوداء على iOS ومقصوصةً على أندرويد`);
    }

    /* الرسم المزاح عن المركز = المقاس المطلوب لم يُفرَض على منفذ العرض */
    if (!r.empty && r.off > CENTER) {
      say(`${f}: مركز الرسم مزاحٌ ${(r.off * 100).toFixed(1)}٪ عن مركز اللوحة — اقتطاعٌ من ركن`);
    }

    /* منطقة القصّ الآمنة: ما خرج عن دائرة الـ٨٠٪ يُقصّ في مشغّل أندرويد */
    const maskable = f.startsWith('icon-maskable');
    if (maskable && !r.empty && r.radius > SAFE) {
      say(`${f}: الرسم يبلغ ${(r.radius * 100).toFixed(1)}٪ من نصف القطر والحدّ ${SAFE * 100}٪ — يُقصّ تحت القناع`);
    }
    const floor = maskable ? FLOOR.maskable : FLOOR.any;
    if (!r.empty && r.radius < floor) {
      say(`${f}: الرسم ${(r.radius * 100).toFixed(1)}٪ من نصف القطر والأدنى ${floor * 100}٪ — ضائعٌ في لوحته`);
    }
  }

  /* المقاسان من مصدرٍ واحد: اختلافهما يعني أن أحدهما صُيِّر بمقاسٍ آخر ثم اقتُطع */
  for (const [a, b] of [['icon-192.png', 'icon-512.png'],
                        ['icon-maskable-192.png', 'icon-maskable-512.png'],
                        ['apple-touch-icon.png', 'icon-512.png']]) {
    if (!m[a] || !m[b] || m[a].empty || m[b].empty) continue;
    const d = Math.abs(m[a].radius - m[b].radius);
    if (d > AGREE) say(`${a} و${b} من مصدرٍ واحد ويختلفان ${(d * 100).toFixed(1)}٪ — أحدهما مُصيَّرٌ بمقاسٍ غير مقاسه`);
  }

  /* iOS لا يقرأ المانيفست وحده: بلا هذا الرابط يأخذ لقطةً من الصفحة أيقونةً */
  const html = join(site, 'index.html');
  if (existsSync(html)) {
    const src = readFileSync(html, 'utf8');
    for (const [re, what] of [
      [/rel=["']apple-touch-icon["']/, 'rel="apple-touch-icon"'],
      [/name=["']apple-mobile-web-app-title["']/, 'apple-mobile-web-app-title'],
      [/name=["']mobile-web-app-capable["']/, 'mobile-web-app-capable'],
    ]) if (!re.test(src)) say(`index.html بلا ${what}`);
  }

  const mf = join(site, 'public', 'manifest.webmanifest');
  if (existsSync(mf)) {
    let j;
    try { j = JSON.parse(readFileSync(mf, 'utf8')); } catch { say('manifest.webmanifest لا يُحلَّل'); j = null; }
    if (j) {
      for (const k of ['id', 'name', 'short_name', 'start_url', 'scope', 'display',
                       'background_color', 'theme_color', 'icons']) {
        if (j[k] === undefined) say(`manifest بلا \`${k}\``);
      }
      const any = (j.icons ?? []).filter((i) => !i.purpose || i.purpose.split(/\s+/).includes('any'));
      for (const s of ['192x192', '512x512']) {
        if (!any.some((i) => i.sizes === s)) say(`manifest بلا أيقونة \`any\` بمقاس ${s} — شرطُ التثبيت على أندرويد`);
      }
      for (const i of j.icons ?? []) {
        const f = join(site, 'public', i.src.replace(/^\.?\//, ''));
        if (!existsSync(f)) say(`manifest يشير إلى ${i.src} وهي غير موجودة`);
      }
    }
  }
  return bad;
}

/* ── التشغيل ───────────────────────────────────────────────────────────── */

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dirs = (p) => readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  const sites = args.length ? args : dirs('curricula').flatMap((cat) =>
    dirs(join('curricula', cat))
      .map((s) => join('curricula', cat, s, 'site'))
      .filter((d) => existsSync(join(d, 'public', 'icons'))));

  let bad = [];
  for (const s of sites) {
    const e = checkSite(s);
    bad = bad.concat(e);
    const dir = join(s, 'public', 'icons');
    const r = existsSync(join(dir, 'icon-maskable-512.png')) ? ink(join(dir, 'icon-maskable-512.png')) : null;
    console.log(`  ${e.length ? '✗' : '✓'} ${s.replace(/^curricula\/|\/site$/g, '').padEnd(34)}` +
      (r ? ` قناع: ${(r.radius * 100).toFixed(1)}٪ من ${SAFE * 100}٪` : ''));
  }
  if (bad.length) { console.log(`\n✗ ${bad.length} خطأ:`); bad.forEach((b) => console.log('  ' + b)); process.exit(1); }
  console.log(`\n✓ ${sites.length} موقعاً: الأيقونات مركزيّة، والمقنَّعة داخل منطقة القصّ، والمانيفست تامّ`);
}
