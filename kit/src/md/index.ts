/**
 * استخراج بنية الفصل من ماركداونه — **ميكانيزم بلا مظهر**.
 *
 * يعرف ثلاثة أشياء فقط: العنوان، والأجزاء (`## `)، واللقطات (`### ` إن وُجدت،
 * وإلّا `## `). ولا يعرف لوناً ولا مكوّناً ولا نوع بلوك: تقسيم اللقطة إلى بلوكات
 * قرارُ المنهج، لأن مفرداته (بوّابة · مخرَج مسجَّل · رفض مترجم) تختلف باختلاف
 * موضوعه.
 */
/** مراسٍ عربية مستقرّة. التشكيل (\p{M}) يغيّر المرساة، فيُزال. */
export function slugify(s: string): string {
  return s
    .trim()
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-')
    .toLowerCase();
}

export interface Section {
  title: string;
  id: string;
  raw: string;
}

/**
 * جزءٌ من فصل: عنوان `## `، وتحته لقطاته `### `.
 *
 * الفصل ٠٠ وحده يحتاجه — أربعة أجزاء لا يقرأ بينها القارئ نفس النوع من النصّ:
 * قصّةٌ ثم بديهياتٌ ثم نظام أنواعٍ ثم طريق. وبلا هذا التقسيم يصير أثرُه قائمةً
 * من خمسين سطراً بلا معالم.
 */
export interface Part {
  title: string;
  id: string;
  lead: string;
  /** فهرس أوّل لقطةٍ فيه ضمن القائمة المسطّحة */
  start: number;
}

export interface Chapter {
  heading: string;
  lead: string;
  parts: Part[];
  sections: Section[];
}

interface Mark { title: string; start: number; after: number }

function marksOf(body: string, depth: number): Mark[] {
  const re = new RegExp(`^#{${depth}}\\s+(.+)$`, 'gm');
  const out: Mark[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.push({ title: m[1]!.trim(), start: m.index, after: re.lastIndex });
  return out;
}

const clean = (s: string) => s.replace(/^\s*---\s*$/gm, '').trim();

/**
 * يفصل الملفّ إلى عنوان + مقدّمة + لقطات.
 *
 * فصلٌ فيه `### ` ذو **أجزاء**: `## ` جزءٌ و`### ` لقطة. وفصلٌ بلا `### `
 * لقطاته `## ` مباشرةً — وهي حال كل إقليمٍ عدا ٠٠. البنية تُقرأ من الماركداون
 * ولا تُعلَن في الكود.
 */
export function parseChapter(md: string): Chapter {
  const text = md.replace(/\r\n/g, '\n');
  const h = text.match(/^#\s+(.+)$/m);
  const heading = h ? h[1]!.trim() : '';
  const body = h ? text.slice(text.indexOf(h[0]) + h[0].length) : text;

  const shotDepth = /^###\s+/m.test(body) ? 3 : 2;
  const shotMarks = marksOf(body, shotDepth);
  const partMarks = shotDepth === 3 ? marksOf(body, 2) : [];

  const firstMark = Math.min(
    ...[shotMarks[0]?.start, partMarks[0]?.start].filter((x): x is number => x !== undefined),
    body.length
  );
  const lead = clean(body.slice(0, firstMark));

  /* حدّ اللقطة أقربُ ما يليها: لقطةٌ أخرى **أو رأس الجزء التالي**. ولولا
     الثاني لابتلعت آخرُ لقطةٍ في الجزء عنوانَ الجزء الذي بعدها ومقدّمته. */
  const stops = [...shotMarks, ...partMarks].map((x) => x.start).sort((a, b) => a - b);
  const sections: Section[] = shotMarks.map((mk) => ({
    title: mk.title,
    id: slugify(mk.title),
    raw: clean(body.slice(mk.after, stops.find((s) => s > mk.start) ?? body.length)),
  }));

  const parts: Part[] = partMarks.map((mk, i) => {
    const end = i + 1 < partMarks.length ? partMarks[i + 1]!.start : body.length;
    const start = shotMarks.findIndex((s) => s.start > mk.start && s.start < end);
    const firstShot = shotMarks.find((s) => s.start > mk.start && s.start < end);
    return {
      title: mk.title,
      id: slugify(mk.title),
      lead: clean(body.slice(mk.after, firstShot ? firstShot.start : end)),
      start: start < 0 ? sections.length : start,
    };
  });

  return { heading, lead, parts, sections };
}
