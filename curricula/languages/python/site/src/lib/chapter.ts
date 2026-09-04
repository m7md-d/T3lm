/**
 * تقطيع الفصل إلى أقسام — **يُقاس من الملفّ ولا يُعلَن في الكود**.
 *
 * قسمٌ فيه `### ` ذو أجزاء: `## ` جزءٌ و`### ` قسم. وقسمٌ بلا `### ` أقسامه
 * `## ` مباشرةً. فيبقى إضافةُ جزءٍ إلى فصلٍ عملاً في الماركداون وحده.
 *
 * والتمرينُ ليس قسماً: هو **أرضيّة الفصل** التي ينغلق عندها. و«الفصل التالي»
 * سطرٌ في آخر الملفّ يصير زرَّ الملاحة — بنيةُ النصّ هي الملاحة.
 */
export type RawShot = { title: string; part?: string; partIntro?: string; body: string };

export type RawRegion = {
  title: string;
  intro: string;
  shots: RawShot[];
  exercise?: string;
  /** جملةُ «الفصل التالي» بلا لقبها — تُعرَض على الأرضيّة وفي الملاحة. */
  next?: string;
};

const FLOOR = new Set(['تمرين', 'التمرين']);
const NEXT = /^\*\*الفصل التالي:\*\*\s*/;

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

  const shots: RawShot[] = [];
  let exercise: string | undefined;
  let next: string | undefined;

  /* «الفصل التالي: …» يقع في آخر الملفّ وقد يلتفّ سطرين، فيُنتزَع بفقرته. */
  for (const s of sections) {
    const kept: string[] = [];
    for (let k = 0; k < s.body.length; k++) {
      const l = s.body[k]!;
      if (!NEXT.test(l.trim())) { kept.push(l); continue; }
      const para = [l.trim().replace(NEXT, '')];
      while (k + 1 < s.body.length && s.body[k + 1]!.trim() !== '') para.push(s.body[++k]!.trim());
      next = para.join(' ').replace(/\*\*/g, '').trim();
    }
    s.body = kept;
  }

  for (const s of sections) {
    if (FLOOR.has(s.head)) {
      exercise = s.body.join('\n').trim();
      continue;
    }

    const hasSub = s.body.some((l) => /^### /.test(l));
    if (!hasSub) {
      shots.push({ title: s.head, body: s.body.join('\n').trim() });
      continue;
    }

    const pre: string[] = [];
    let cur: RawShot | null = null;
    for (const l of s.body) {
      if (/^### /.test(l)) {
        if (cur) shots.push(cur);
        cur = { title: l.replace(/^###\s+/, '').trim(), part: s.head, body: '' };
        if (!shots.some((x) => x.part === s.head)) cur.partIntro = pre.join('\n').trim() || undefined;
        continue;
      }
      if (cur) cur.body += (cur.body ? '\n' : '') + l;
      else pre.push(l);
    }
    if (cur) shots.push(cur);
  }

  return { title, intro: introLines.join('\n').trim(), shots, exercise, next };
}
