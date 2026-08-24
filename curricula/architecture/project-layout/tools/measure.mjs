#!/usr/bin/env node
/**
 * measure — يقرأ الهياكل من `regions/*.md` ويحسب عليها، ولا يُكتب رقمٌ بيد.
 *
 *   node tools/measure.mjs            تقرير كل هيكلٍ في المنهج
 *   node tools/measure.mjs <id>       تقرير هيكلٍ واحد
 *   node tools/measure.mjs --check    يقارن كل لوحةٍ في الماركداون بالحساب
 *   node tools/measure.mjs --fix      يكتب اللوحات من الحساب — فلا يُطبَع رقمٌ بيد
 *   node tools/measure.mjs --table    جدول المقارنة عبر الهياكل كلّها
 *
 * سببه أن هذا المجال أكثر ما يُقال فيه بلا دليل. فكل عددٍ في المنهج **مخرَجُ
 * هذا الأمر**، وتحريرُ سطرٍ في هيكلٍ يُفشِل `--check` حتى تُعاد اللوحة.
 *
 * ── صيغة الهيكل ──
 * كتلةٌ مسوَّمة ```layout في الماركداون:
 *
 *   id: hexagonal
 *   name: منفذٌ ومهايئ
 *   policy: core-independent
 *   ---
 *   app/order          core  ordering,pricing  ->  app/ports
 *   app/ports          port  -                 ->
 *   adapters/postgres  io    persistence       ->  app/ports
 *   main               wire  wiring            ->  app/order, adapters/postgres
 *
 * العمود الثاني **دور** الملفّ، والثالث ما **يملكه** من الاهتمامات، والرابع من
 * يستورده. والمسار بلا امتداد عمداً: الهيكلة لا تخصّ لغة.
 *
 * ولوحةٌ مخرَجُها من أداةٍ أخرى (مترجمٌ أو أمرُ صدفة) تُعلَن `<!-- shell -->` قبلها،
 * فتُعدّ «خارج الجهاز» ولا تُحسَب سائبة — **معلومةً لا مخفيّة**.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const REG = path.join(ROOT, 'regions');

/* ── الأدوار ──
   `core` منطقٌ لا يعرف العالم · `port` عقدٌ يملكه القلب · `app` تنسيقُ حالةِ
   استعمال · `edge` مهايئٌ يقود (http, cli) · `io` مهايئٌ مقود (db, email) ·
   `wire` جذرُ التركيب · `shared` مشترَكٌ بلا اتّجاه. */
const ROLES = ['core', 'port', 'app', 'edge', 'io', 'wire', 'shared'];
const OUTWARD = new Set(['edge', 'io']);

/* مجلّداتٌ ليست ميزةً — بنيةٌ تحتية يشترك فيها الجميع بحقّ */
const NOT_FEATURE = new Set(['shared', 'infra', 'common', 'platform', 'api', 'gateway', 'main']);
const feature = (p) => {
  const segs = p.split('/');
  const top = segs[0];
  if (NOT_FEATURE.has(top) || segs.length === 1) return null;
  return top === 'modules' ? segs[1] : top;
};

/* ── قواعد الاتّجاه ──
   كل هيكلٍ يعلن قاعدته، والفاحص يفحص **قاعدته هو**. و`none` ليست عيباً في
   الأداة: هي **النتيجة** — هيكلٌ لا يَعِد بشيء لا يُخالِف شيئاً. */
const POLICIES = {
  none: { label: 'لا قاعدة', test: () => [] },
  'core-independent': {
    label: 'القلب لا يعتمد على الخارج',
    test: (g) => edges(g).filter(([a, b]) =>
      (g.files[a].role === 'core' || g.files[a].role === 'port') && OUTWARD.has(g.files[b].role)),
  },
  'layer-downward': {
    label: 'الطبقة تعتمد على ما تحتها فقط',
    test: (g) => {
      const rank = { edge: 0, app: 1, core: 2, port: 2, io: 3, shared: 4, wire: -1 };
      return edges(g).filter(([a, b]) =>
        g.files[a].role !== 'wire' && rank[g.files[b].role] < rank[g.files[a].role]);
    },
  },
  'ring-inward': {
    label: 'الاعتماد يتّجه للداخل دائماً',
    test: (g) => {
      const rank = { edge: 0, io: 0, app: 1, core: 2, port: 2, shared: 3, wire: -1 };
      return edges(g).filter(([a, b]) =>
        g.files[a].role !== 'wire' && rank[g.files[b].role] < rank[g.files[a].role]);
    },
  },
  'feature-sealed': {
    label: 'الميزة لا تستورد ميزةً أخرى إلا عبر عقد',
    test: (g) => edges(g).filter(([a, b]) => {
      const fa = feature(a), fb = feature(b);
      return fa && fb && fa !== fb && g.files[a].role !== 'wire'
        && !['port', 'shared'].includes(g.files[b].role);
    }),
  },
};

/* ── التغييرات الخمسة — واحدةٌ لكل الهياكل، وإلا فلا مقارنة ── */
const CHANGES = [
  { id: 'C1', label: 'قناة إشعارٍ ثانية', concern: 'notification', kind: 'add-adapter' },
  { id: 'C2', label: 'قاعدة خصمٍ جديدة', concern: 'pricing', kind: 'internal' },
  { id: 'C3', label: 'تبديل قاعدة البيانات', concern: 'persistence', kind: 'swap-adapter' },
  { id: 'C4', label: 'واجهة CLI بجانب HTTP', concern: 'http', kind: 'add-adapter' },
  { id: 'C5', label: 'استخراج الطلبات خدمةً', concern: 'ordering', kind: 'extract' },
];

const edges = (g) => g.edges;

/* ── القراءة ── */
export function parseLayouts(md) {
  const out = [];
  const re = /```layout\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md))) out.push(build(m[1]));
  return out;
}

function build(body) {
  const g = { id: '', name: '', policy: 'none', enforced: 'review', compare: 'yes', files: {}, edges: [], order: [] };
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line === '---' || line.startsWith('#')) continue;

    const head = line.match(/^(id|name|policy|enforced|compare):\s*(.+)$/);
    if (head) { g[head[1]] = head[2].trim(); continue; }

    const [lhs, rhs = ''] = line.split('->');
    const cols = lhs.trim().split(/\s{2,}|\t+/).map((x) => x.trim()).filter(Boolean);
    if (cols.length < 3) throw new Error(`سطرٌ ناقص في «${g.id}»: ${line}`);
    const [file, role, owns] = cols;
    if (!ROLES.includes(role)) throw new Error(`دورٌ غير معروف «${role}» في ${file}`);

    g.files[file] = {
      role,
      owns: owns === '-' ? [] : owns.split(',').map((x) => x.trim()).filter(Boolean),
    };
    g.order.push(file);
    for (const d of rhs.split(',').map((x) => x.trim()).filter(Boolean)) g.edges.push([file, d]);
  }
  for (const [a, b] of g.edges)
    if (!g.files[b]) throw new Error(`«${g.id}»: ${a} يستورد ${b} وهو غير معرَّف`);
  return g;
}

/* ── الحساب ── */
const pkgOf = (f) => (f.includes('/') ? f.split('/').slice(0, -1).join('/') : '.');
const owners = (g, concern) => g.order.filter((f) => g.files[f].owns.includes(concern));
const deps = (g, f) => g.edges.filter(([a]) => a === f).map(([, b]) => b);
const dependents = (g, f) => g.edges.filter(([, b]) => b === f).map(([a]) => a);

function cycles(g) {
  const seen = {}, stack = new Set(), found = [];
  const walk = (f, trail) => {
    if (stack.has(f)) { found.push([...trail.slice(trail.indexOf(f)), f]); return; }
    if (seen[f]) return;
    seen[f] = 1; stack.add(f);
    for (const d of deps(g, f)) walk(d, [...trail, d]);
    stack.delete(f);
  };
  for (const f of g.order) walk(f, [f]);
  return found;
}

/** أطول سلسلة استيرادٍ تبدأ من مهايئٍ قائد — كم طبقةً يعبرها الطلب. */
function depth(g) {
  let best = 0;
  const walk = (f, n, seen) => {
    if (seen.has(f)) return;
    best = Math.max(best, n);
    for (const d of deps(g, f)) walk(d, n + 1, new Set([...seen, f]));
  };
  for (const f of g.order) if (g.files[f].role === 'edge') walk(f, 1, new Set());
  return best;
}

/**
 * هل يصل القائدُ إلى المقود **بالاستيراد**؟
 * «لا» تعني أن العقد قطع السلسلة، وأن الوصل يقع في جذر التركيب وقت التشغيل.
 */
function edgeReachesIo(g) {
  const walk = (f, seen) => {
    if (seen.has(f)) return false;
    for (const d of deps(g, f)) {
      if (g.files[d].role === 'io') return true;
      if (walk(d, new Set([...seen, f]))) return true;
    }
    return false;
  };
  const edges_ = g.order.filter((f) => g.files[f].role === 'edge');
  if (!edges_.length) return null;   // لا مهايئ قائد — والسؤال لا معنى له
  return edges_.some((f) => walk(f, new Set()));
}

/** ما يلمسه القلبُ من العالم — وهو **عدد البدائل اللازمة** لاختباره وحده. */
function coreReach(g) {
  const hit = new Set();
  const walk = (f, seen) => {
    if (seen.has(f)) return;
    for (const d of deps(g, f)) {
      if (OUTWARD.has(g.files[d].role)) hit.add(d);
      walk(d, new Set([...seen, f]));
    }
  };
  if (!g.order.some((f) => g.files[f].role === 'core')) return null;  // لا قلب مفصول
  for (const f of g.order) if (g.files[f].role === 'core') walk(f, new Set());
  return [...hit];
}

/**
 * كلفة التغيير — نموذجٌ صريحٌ محدود، وحدوده مذكورةٌ في الفصل ٠٠:
 *
 * - `internal`     يُلمَس مالكو الاهتمام فقط. التوقيع لم يتغيّر.
 * - `add-adapter`  ملفٌّ جديد + جذر التركيب + **كل من يعتمد على مهايئٍ ملموس**
 *                  من نوع الاهتمام نفسه. ومن اعتمد على `port` لا يُلمَس.
 * - `swap-adapter` مالكو الاهتمام + من يعتمد عليهم **بلا وساطة عقد**.
 * - `extract`      مالكو الاهتمام وما يلزمهم من `core`/`port`، وتُعدّ الحوافّ
 *                  التي تُقطَع عند الحدّ الجديد.
 */
function changeCost(g, c) {
  const own = owners(g, c.concern);
  /* اهتمامٌ لا مالك له في هذا الهيكل — والفراغ أصدق من صفرٍ يُقرأ «رخيص» */
  if (!own.length) return { files: null, risk: null, note: '' };
  const risk = (files) => files.reduce(
    (n, f) => n + g.files[f].owns.filter((x) => x !== c.concern).length, 0);

  if (c.kind === 'internal') {
    return { files: own, risk: risk(own), note: '' };
  }

  if (c.kind === 'add-adapter') {
    const touched = new Set(g.order.filter((f) => g.files[f].role === 'wire'));
    for (const o of own) for (const d of dependents(g, o))
      if (g.files[d].role !== 'wire') touched.add(d);
    const f = [...touched];
    return { files: f, risk: risk(f), note: '' };
  }

  if (c.kind === 'swap-adapter') {
    const touched = new Set(own);
    for (const o of own) for (const d of dependents(g, o)) touched.add(d);
    const f = [...touched];
    return { files: f, risk: risk(f), note: '' };
  }

  /* extract */
  const inside = new Set(own);
  const grow = (f) => { for (const d of deps(g, f)) if (!inside.has(d) && ['core', 'port'].includes(g.files[d].role)) { inside.add(d); grow(d); } };
  for (const o of [...inside]) grow(o);
  const cut = g.edges.filter(([a, b]) => inside.has(a) !== inside.has(b));
  const dragged = new Set();
  for (const f of inside) for (const x of g.files[f].owns) if (x !== c.concern) dragged.add(x);
  return { files: [...inside], risk: dragged.size, note: `${cut.length} حافّةً تُقطَع` };
}

/** مكوّناتٌ لا يربطها استيراد — كلٌّ منها يُبنى ويُنشَر وحده. */
function components(g) {
  const seen = new Set();
  let n = 0;
  const near = (f) => [...deps(g, f), ...dependents(g, f)];
  for (const f of g.order) {
    if (seen.has(f)) continue;
    n++;
    const q = [f];
    while (q.length) {
      const x = q.pop();
      if (seen.has(x)) continue;
      seen.add(x);
      q.push(...near(x));
    }
  }
  return n;
}

/**
 * حوافّ تعبر المجلّد الأعلى — وهي الرقم الذي يفرّق «بالطبقة» عن «بالميزة».
 * وحوافّ جذر التركيب مستثناة: وظيفته أن يعبر.
 */
function crossing(g) {
  const real = g.edges.filter(([a]) => g.files[a].role !== 'wire');
  const cross = real.filter(([a, b]) =>
    a.includes('/') && b.includes('/') && a.split('/')[0] !== b.split('/')[0]);
  return [cross.length, real.length];
}

/* ── التقرير ── */
/** من يحرس الحدّ فعلاً — والفرق بين الثلاثة هو نصف هذا المنهج. */
const GUARD = {
  import: 'الاستيراد — أداةُ البناء ترفض',
  runtime: 'التركيب — يُكشَف عند التشغيل',
  review: 'المراجعة — لا شيء يمنع',
};

export function report(g) {
  const pk = new Set(g.order.map(pkgOf));
  const pol = POLICIES[g.policy];
  if (!pol) throw new Error(`قاعدةٌ غير معروفة: ${g.policy}`);
  const bad = pol.test(g);
  const reach = coreReach(g);
  const cyc = cycles(g);

  const L = [];
  L.push(`${g.id} — ${g.name}`);
  L.push(`ملفّات ${g.order.length} · حزم ${pk.size} · حوافّ ${g.edges.length} · دورات ${cyc.length}`);
  const reaches = edgeReachesIo(g);
  const [cx, all] = crossing(g);
  L.push(`حوافّ تعبر المجلّد الأعلى: ${cx} من ${all}`);
  L.push(`أطول سلسلة استيراد: ${depth(g)} · القائد يصل إلى المقود: ${reaches === null ? 'لا مهايئ قائد' : reaches ? 'نعم' : 'لا'}`);
  const roots = g.order.filter((f) => g.files[f].role === 'wire').length;
  const parts = components(g);
  if (roots !== 1) L.push(`جذور تركيب: ${roots}`);
  if (parts > 1) L.push(`رسومٌ منفصلة: ${parts}  ⇐ وحداتُ نشرٍ لا يربطها استيراد`);
  L.push(`القاعدة: ${pol.label} — مخالفات ${bad.length}`);
  L.push(`يحرسها: ${GUARD[g.enforced] ?? g.enforced}`);
  for (const [a, b] of bad) L.push(`   ✗ ${a} -> ${b}`);
  L.push(reach === null
    ? 'بدائل يلزمها اختبار القلب: لا قلب مفصول'
    : `بدائل يلزمها اختبار القلب: ${reach.length}${reach.length ? '  (' + reach.join(' · ') + ')' : ''}`);
  L.push('كلفة التغيير:   ملفّات · اهتماماتٌ مجاورة تُخاطر');
  for (const c of CHANGES) {
    const r = changeCost(g, c);
    if (r.files === null) { L.push(`  ${c.id} ${c.label.padEnd(22)}  — لا مالك لهذا الاهتمام`); continue; }
    const n = String(r.files.length).padStart(2);
    const k = String(r.risk).padStart(2);
    L.push(`  ${c.id} ${c.label.padEnd(22)} ${n} · ${k}${r.note ? '   ' + r.note : ''}`);
  }
  return L.join('\n');
}

/* ── المدخل ── */
function all() {
  const out = [];
  for (const f of fs.readdirSync(REG).sort()) {
    if (!f.endsWith('.md')) continue;
    for (const g of parseLayouts(fs.readFileSync(path.join(REG, f), 'utf8')))
      out.push({ g, file: f });
  }
  return out;
}

/** `compare: no` يُخرِج الهيكل من جدول المقارنة — للأمثلة التعليمية. */
function table(list) {
  list = list.filter(({ g }) => g.compare !== 'no');
  const head = ['الهيكل', 'ملفّات', 'حزم', 'عابرة', 'سلسلة', 'يصل', 'مخالفات', 'بدائل', ...CHANGES.map((c) => c.id)];
  /* خانة التغيير: «ملفّات/اهتمامات مجاورة» */
  const rows = list.map(({ g }) => {
    const bad = POLICIES[g.policy].test(g).length;
    const [cx, all] = crossing(g);
    return [g.id, g.order.length, new Set(g.order.map(pkgOf)).size, `${cx}/${all}`, depth(g),
      { true: 'نعم', false: 'لا', null: '—' }[edgeReachesIo(g)], bad,
      coreReach(g) === null ? '—' : coreReach(g).length,
      ...CHANGES.map((c) => { const r = changeCost(g, c); return r.files === null ? '—' : `${r.files.length}/${r.risk}`; })];
  });
  const w = head.map((h, i) => Math.max(String(h).length, ...rows.map((r) => String(r[i]).length)));
  const line = (r) => r.map((c, i) => String(c).padEnd(w[i])).join('  ').trimEnd();
  return [line(head), w.map((n) => '-'.repeat(n)).join('  '), ...rows.map(line)].join('\n');
}

const arg = process.argv[2];
if (import.meta.filename === process.argv[1]) {
  const list = all();
  if (arg === '--table') console.log(table(list));
  else if (arg && !arg.startsWith('--')) {
    const hit = list.find(({ g }) => g.id === arg);
    if (!hit) { console.error(`لا هيكل بهذا المعرّف: ${arg}`); process.exit(1); }
    console.log(report(hit.g));
  } else if (arg === '--check') {
    process.exit(check());
  } else if (arg === '--fix') {
    process.exit(check(true));
  } else {
    for (const { g } of list) console.log(report(g) + '\n');
  }
}

/**
 * يقارن كل لوحةٍ في الماركداون بحساب الأداة.
 *
 * واللوحة تُنسَب إلى **أقرب كتلة `layout` قبلها**، ولو فصلَ بينهما سطرُ أمرٍ أو
 * شرح — فالرقم المكتوب بيد يُفشِل الفحص باسم ملفّه وسطره.
 */
function check(fix = false) {
  let bad = 0, ok = 0, loose = 0, outside = 0;
  for (const f of fs.readdirSync(REG).sort()) {
    if (!f.endsWith('.md')) continue;
    const file = path.join(REG, f);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const patch = [];
    const toks = [];
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      if (/^<!--\s*shell\s*-->\s*$/.test(ln)) { toks.push(['shell', i + 1, null]); continue; }
      if (/^<!--\s*err(?::.*)?\s*-->\s*$/.test(ln)) { toks.push(['shell', i + 1, null]); continue; }
      if (/^<!--\s*out(?::.*)?\s*-->\s*$/.test(ln)) { toks.push(['out', i + 1, null]); continue; }
      if (/^\*{0,2}المخرَج\*{0,2}\s*:\s*$/.test(ln.trim())) { toks.push(['out', i + 1, null]); continue; }
      if (ln.startsWith('```')) {
        const lang = ln.slice(3).trim(), body = [], start = i + 1;
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
        toks.push(['fence', start, [lang, body.join('\n')]]);
      }
    }
    for (let k = 0; k < toks.length; k++) {
      if (toks[k][0] !== 'out') continue;
      if (toks[k - 1]?.[0] === 'shell') { outside++; continue; }
      if (toks[k + 1]?.[0] !== 'fence') continue;
      const panel = toks[k + 1][2][1];
      let j = k - 1;
      while (j >= 0 && !(toks[j][0] === 'fence' && toks[j][2][0] === 'layout')) j--;
      if (j < 0) {
        loose++;
        console.log(`  ! ${f}:${toks[k][1]} لوحةٌ بلا هيكلٍ قبلها`);
        continue;
      }
      const g = build(toks[j][2][1]);
      const want = report(g).trim();
      if (want === panel.trim()) { ok++; console.log(`  ✓ ${f.slice(0, 2)}:${toks[k][1]} ${g.id}`); }
      else if (fix) {
        ok++;
        patch.push([toks[k + 1][1], toks[k + 1][1] + panel.split('\n').length - 1, want.split('\n')]);
        console.log(`  ~ ${f.slice(0, 2)}:${toks[k][1]} ${g.id} — أُعيدت من الحساب`);
      } else {
        bad++;
        console.log(`  ✗ ${f.slice(0, 2)}:${toks[k][1]} ${g.id}\n--- في الماركداون ---\n${panel.trim()}\n--- الحساب ---\n${want}`);
      }
    }
    if (patch.length) {
      for (const [from, to, body] of patch.reverse()) lines.splice(from, to - from + 1, ...body);
      fs.writeFileSync(file, lines.join('\n'));
    }
  }
  console.log(`\nلوحات: ${ok + bad + loose + outside} · مطابق: ${ok} · مختلف: ${bad}`
    + ` · خارج الجهاز: ${outside} · سائبة: ${loose}`);
  return bad || loose ? 1 : 0;
}
