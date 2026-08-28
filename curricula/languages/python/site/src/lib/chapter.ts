/**
 * تقطيع الإقليم إلى لقطات — **يُقاس من الملفّ ولا يُعلَن في الكود**.
 *
 * فصلٌ فيه `### ` ذو أجزاء: `## ` جزءٌ و`### ` لقطة. وفصلٌ بلا `### ` لقطاته
 * `## ` مباشرةً. فيبقى إضافةُ جزءٍ إلى فصلٍ عملاً في الماركداون وحده.
 *
 * والخلاصةُ والتمرينُ ليستا لقطتين: هما **أرضيّة الإقليم** التي ينغلق عندها.
 */
export type RawShot = { title: string; part?: string; partIntro?: string; body: string };

export type RawRegion = {
  title: string;
  intro: string;
  shots: RawShot[];
  exercise?: string;
  summary?: string;
};

const FLOOR = new Set(['التمرين', 'الخلاصة']);

export function splitRegion(md: string): RawRegion {
  const lines = md.split('\n');
  let title = '';
  const introLines: string[] = [];
  let i = 0;

  for (; i < lines.length; i++) {
    const ln = lines[i]!;
    if (/^# /.test(ln)) { title = ln.replace(/^#\s+/, '').trim(); continue; }
    if (/^## /.test(ln)) break;
    if (/^>\s?/.test(ln) || (introLines.length && ln.trim() === '')) {
      introLines.push(ln.replace(/^>\s?/, ''));
    }
  }

  const sections: { head: string; body: string[] }[] = [];
  for (; i < lines.length; i++) {
    const ln = lines[i]!;
    if (/^## /.test(ln)) sections.push({ head: ln.replace(/^##\s+/, '').trim(), body: [] });
    else if (sections.length) sections[sections.length - 1]!.body.push(ln);
  }

  const shots: RawShot[] = [];
  let exercise: string | undefined;
  let summary: string | undefined;

  for (const s of sections) {
    if (FLOOR.has(s.head)) {
      const body = s.body.join('\n').trim();
      if (s.head === 'التمرين') exercise = body;
      else summary = body;
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

  return { title, intro: introLines.join('\n').trim(), shots, exercise, summary };
}
