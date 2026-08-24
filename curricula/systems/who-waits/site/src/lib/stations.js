/**
 * تحويل إقليمٍ من المنهج إلى **محطّات** — وهذه هي نقطة الاشتقاق الأساسية للموقع.
 *
 * المنهج يعلن في README قالب درسه صراحةً: نبذة → لغز → درس → تمرين → خلاصة.
 * فالموقع لا يعرض الملفّ كصفحةٍ واحدة طويلة، بل كخمس محطّات؛ ومحطّة «الدرس»
 * تنقسم بدورها إلى **خطوات** لأن نصّها مرقّم أصلاً (`### ١) …`).
 *
 * لا شيء هنا يخترع بنية: كل انقسامٍ موجودٌ في الماركداون قبل الموقع.
 */
import { parseChapter, slugify } from './markdown.js';

/** أدوار المحطّات — مشتقّة من عناوين الأقسام كما كتبها المنهج */
const ROLES = [
  { role: 'brief', match: /النبذة/, label: 'النبذة', hint: 'أين نحن ولماذا الآن' },
  { role: 'puzzle', match: /^اللغز/, label: 'اللغز', hint: 'قبل أي شرح — حاوِل' },
  { role: 'lesson', match: /^الدرس/, label: 'الدرس', hint: 'ليش قبل كيف' },
  { role: 'drill', match: /^التمرين|^الكابستون/, label: 'التمرين', hint: 'قيودٌ تمنع الالتفاف' },
  { role: 'synth', match: /^الخلاصة|^الخاتمة/, label: 'الخلاصة', hint: 'أين تتّصل بالشجرة' },
];

function roleOf(title) {
  for (const r of ROLES) if (r.match.test(title.trim())) return r;
  return { role: 'plain', label: title.trim(), hint: '' };
}

/**
 * يفصل صناديق «🧨 جذر الخطأ» عن النصّ.
 * الصندوق في المصدر اقتباسٌ يبدأ سطره الأول بـ🧨 — علامةٌ متكرّرة عبر المنهج
 * كلّه، فتستحقّ مكوّناً لا تنسيقاً.
 */
export function splitBlast(md) {
  const lines = String(md).split('\n');
  const out = [];
  let buf = [];
  let i = 0;
  const flush = () => {
    const t = buf.join('\n');
    if (t.trim()) out.push({ type: 'md', text: t });
    buf = [];
  };
  while (i < lines.length) {
    if (/^>\s*🧨/.test(lines[i])) {
      flush();
      let j = i;
      while (j < lines.length && /^>/.test(lines[j])) j++;
      const body = lines
        .slice(i, j)
        .map((l) => l.replace(/^>\s?/, ''))
        .join('\n');
      i = j;
      const paras = body.split(/\n\s*\n/);
      const head = (paras.shift() || '').replace(/^🧨\s*/, '').trim();
      out.push({ type: 'blast', head, body: paras.join('\n\n').trim() });
      continue;
    }
    buf.push(lines[i]);
    i++;
  }
  flush();
  return out;
}

/** يقسم نصّ محطّةٍ إلى خطوات على عناوين `### ` — إن وُجد اثنان فأكثر */
function toSteps(body) {
  const re = /^###\s+(.+)$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(body))) marks.push({ title: m[1].trim(), start: m.index, after: re.lastIndex });
  if (marks.length < 2) return null;
  const steps = [];
  const intro = body.slice(0, marks[0].start).trim();
  if (intro) steps.push({ title: 'مدخل', id: 'مدخل', blocks: splitBlast(intro), intro: true });
  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].start : body.length;
    steps.push({
      title: mk.title,
      id: slugify(mk.title),
      blocks: splitBlast(body.slice(mk.after, end).trim()),
    });
  });
  return steps;
}

/**
 * «البابان» في نهاية كل إقليم: أوّل فقرتين تبدآن بعنوانٍ عريضٍ داخل الخلاصة.
 * المنهج يختم كل إقليمٍ ببابٍ فُتِح وبابٍ لم يُفتح بعد — فالموقع يرسمهما بابين.
 */
export function extractDoors(body) {
  const paras = String(body).split(/\n\s*\n/);
  const doors = [];
  const rest = [];
  for (const p of paras) {
    const m = doors.length < 2 && p.match(/^\*\*([^*:]{2,64}):\*\*\s*([\s\S]+)$/);
    if (m) doors.push({ label: m[1].trim(), text: m[2].trim() });
    else rest.push(p);
  }
  if (doors.length < 2) return { doors: null, rest: body };
  return { doors, rest: rest.join('\n\n') };
}

/** بطاقة الإجهاد: `> **محور الإجهاد:** …` + `> **السؤال:** …` في صدر كل إقليم */
export function parseLead(lead) {
  const flat = String(lead)
    .split('\n')
    .map((l) => l.replace(/^>\s?/, ''))
    .join('\n');
  const axis = flat.match(/\*\*محور الإجهاد:\*\*\s*([^\n]+)/);
  const question = flat.match(/\*\*السؤال:\*\*\s*([\s\S]*?)(?=\n\s*\n|\n\*\*|$)/);
  const noteStart = flat.indexOf('\n\n');
  const note = noteStart === -1 ? '' : flat.slice(noteStart).trim();
  return {
    axis: axis ? axis[1].trim().replace(/\.$/, '') : '',
    question: question ? question[1].trim().replace(/\s+/g, ' ') : '',
    note,
  };
}

/** يحوّل ملفّ إقليمٍ خاماً إلى وثيقة محطّات جاهزة للعرض */
export function buildRegion(raw) {
  const doc = parseChapter(raw);
  const lead = parseLead(doc.lead);
  const stations = doc.sections.map((s) => {
    const r = roleOf(s.title);
    const st = {
      id: s.id,
      title: s.title,
      role: r.role,
      label: r.label,
      hint: r.hint,
      raw: s.raw,
    };
    if (r.role === 'synth') {
      const { doors, rest } = extractDoors(s.raw);
      st.doors = doors;
      st.blocks = splitBlast(rest);
    } else {
      const steps = toSteps(s.raw);
      if (steps) st.steps = steps;
      else st.blocks = splitBlast(s.raw);
    }
    return st;
  });
  return { heading: doc.heading, lead, stations };
}

/**
 * الملحقات تُقسَّم بنفس منطق الأقاليم: أجزاءٌ تُفتَح واحداً واحداً.
 * مبرَّرٌ بنصّ المنهج نفسه عن الورقة المرجعيّة: «تُفتح أثناء العمل، لا تُقرأ
 * مرّةً واحدة» — من يعمل يقفز إلى جزءٍ بعينه.
 * يستعمل `## ` إن كفت، وإلا `### ` (ملحق النماذج الذهنيّة مبنيٌّ على `### `).
 */
export function buildDoc(raw) {
  const doc = parseChapter(raw);
  if (doc.sections.length >= 3) {
    return { lead: doc.lead, parts: doc.sections.map((s) => ({ title: s.title, id: s.id, body: s.raw })) };
  }
  const src = doc.sections.length ? doc.sections.map((s) => `## ${s.title}\n${s.raw}`).join('\n') : doc.lead;
  const re = /^###\s+(.+)$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(src))) marks.push({ title: m[1].trim(), start: m.index, after: re.lastIndex });
  if (marks.length < 3) return { lead: '', parts: [{ title: 'الكلّ', id: 'all', body: raw }] };
  const lead = src.slice(0, marks[0].start).replace(/^\s*---\s*$/gm, '').trim();
  const parts = marks.map((mk, i) => ({
    title: mk.title,
    id: slugify(mk.title),
    body: src.slice(mk.after, i + 1 < marks.length ? marks[i + 1].start : src.length).replace(/^\s*---\s*$/gm, '').trim(),
  }));
  return { lead, parts };
}

/** فهرس بحثٍ مسطّح: أقاليم + محطّات + خطوات + صناديق الخطأ */
export function buildIndex(regions, docs) {
  const idx = [];
  for (const r of regions) {
    const d = docs[r.slug];
    if (!d) continue;
    idx.push({ kind: 'إقليم', to: r.path, title: r.title, sub: r.full, hay: `${r.title} ${r.full} ${r.blurb} ${d.lead.axis}` });
    for (const st of d.stations) {
      idx.push({
        kind: st.label,
        to: `${r.path}?s=${encodeURIComponent(st.id)}`,
        title: st.title,
        sub: `${r.id} · ${r.title}`,
        hay: `${st.title} ${st.raw.slice(0, 1200)}`,
      });
      for (const step of st.steps || []) {
        if (step.intro) continue;
        idx.push({
          kind: 'خطوة',
          to: `${r.path}?s=${encodeURIComponent(st.id)}&k=${encodeURIComponent(step.id)}`,
          title: step.title,
          sub: `${r.id} · ${st.label}`,
          hay: `${step.title} ${step.blocks.map((b) => b.text || `${b.head} ${b.body}`).join(' ').slice(0, 1600)}`,
        });
        for (const b of step.blocks) {
          if (b.type !== 'blast') continue;
          idx.push({
            kind: '🧨 خطأ',
            to: `${r.path}?s=${encodeURIComponent(st.id)}&k=${encodeURIComponent(step.id)}`,
            title: b.head.replace(/\*\*/g, '').slice(0, 90),
            sub: `${r.id} · ${step.title}`,
            hay: `${b.head} ${b.body}`,
          });
        }
      }
      for (const b of st.blocks || []) {
        if (b.type !== 'blast') continue;
        idx.push({
          kind: '🧨 خطأ',
          to: `${r.path}?s=${encodeURIComponent(st.id)}`,
          title: b.head.replace(/\*\*/g, '').slice(0, 90),
          sub: `${r.id} · ${st.label}`,
          hay: `${b.head} ${b.body}`,
        });
      }
    }
  }
  return idx;
}
