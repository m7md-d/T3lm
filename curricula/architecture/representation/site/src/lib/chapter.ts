/**
 * تقطيع الفصل إلى أقسام — **يُقاس من الملفّ ولا يُعلَن في الكود**.
 *
 * وكلُّ فصلٍ هنا مسطّح: `## ` قسمٌ، ولا مستوى ثالث. فإضافةُ قسمٍ عملٌ في
 * الماركداون وحده.
 *
 * والتمرينُ ليس قسماً: هو أرضيّة الفصل التي ينغلق عندها. و«الفصل التالي» سطرٌ
 * في آخر الملفّ يصير زرَّ الملاحة — بنيةُ النصّ هي الملاحة.
 */
export type RawShot = { title: string; body: string };

export type RawRegion = {
  title: string;
  intro: string;
  shots: RawShot[];
  exercise?: string;
  /** جملةُ «الفصل التالي» بلا لقبها — تُعرَض على الأرضيّة وفي الملاحة. */
  next?: string;
};

const FLOOR = new Set(['تمرين', 'التمرين']);
const NEXT = /^\*\*(?:الفصل التالي|بعد هذا الفصل):\*\*\s*/;

export function splitRegion(md: string): RawRegion {
  const lines = md.split('\n');
  let title = '';
  const introLines: string[] = [];
  let i = 0;

  for (; i < lines.length; i++) {
    const ln = lines[i]!;
    if (/^# /.test(ln)) { title = ln.replace(/^#\s+/, '').trim(); continue; }
    if (/^## /.test(ln)) break;
    if (!title) continue;
    if (/^-{3,}$/.test(ln.trim())) continue;
    introLines.push(ln.replace(/^>\s?/, ''));
  }

  const sections: { head: string; body: string[] }[] = [];
  for (; i < lines.length; i++) {
    const ln = lines[i]!;
    if (/^## /.test(ln)) sections.push({ head: ln.replace(/^##\s+/, '').trim(), body: [] });
    else if (sections.length) sections[sections.length - 1]!.body.push(ln);
  }

  let next: string | undefined;

  /* «الفصل التالي: …» يقع في آخر الملفّ وقد يلتفّ أسطراً، فيُنتزَع بفقرته. */
  for (const s of sections) {
    const kept: string[] = [];
    for (let k = 0; k < s.body.length; k++) {
      const l = s.body[k]!;
      if (!NEXT.test(l.trim())) { kept.push(l); continue; }
      const para = [l.trim().replace(NEXT, '')];
      while (k + 1 < s.body.length && s.body[k + 1]!.trim() !== '') para.push(s.body[++k]!.trim());
      /* يُعرَض نصّاً في الزرّ والبطاقة، فلا يصل القارئَ ماركداونٌ خام. */
      next = para.join(' ').replace(/\*\*/g, '').replace(/`/g, '').trim();
    }
    s.body = trimEdges(kept);
  }

  const shots: RawShot[] = [];
  let exercise: string | undefined;
  for (const s of sections) {
    if (FLOOR.has(s.head)) { exercise = s.body.join('\n').trim(); continue; }
    const body = s.body.join('\n').trim();
    if (body) shots.push({ title: s.head, body });
  }

  return { title, intro: introLines.join('\n').trim(), shots, exercise, next };
}

/** الفاصلُ `---` بين الأقسام حدٌّ بصريّ في الماركداون، ولا معنى له في لقطة. */
function trimEdges(body: string[]): string[] {
  const out = [...body];
  while (out.length && (!out[out.length - 1]!.trim() || /^-{3,}$/.test(out[out.length - 1]!.trim()))) out.pop();
  while (out.length && !out[0]!.trim()) out.shift();
  return out;
}
