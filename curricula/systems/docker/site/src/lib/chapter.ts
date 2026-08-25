/**
 * تقسيم الإقليم إلى لقطات — **بقاعدةٍ تُقاس من الملفّ**.
 *
 * العدّة تعتبر أيّ `###` علامةَ أجزاء، وهي قاعدةٌ صحّت لمناهج اللغات: `###`
 * هناك لا يظهر إلا في الفصل صفر. وهذا المنهج يستعمل `###` استعمالاً آخر —
 * تعليلاً **داخل** اللقطة (أكثره «لماذا»، والأسلوب §٢ يقدّم «ليش» على «كيف») —
 * فالقاعدة هنا نسبيّة لا وجودية:
 *
 *   `###` أكثر من `##`  ⇒  `##` جزءٌ و`###` لقطة   (الفصل صفر: ١٨ مقابل ٦)
 *   وإلّا                ⇒  `##` لقطة و`###` مقطعٌ بداخلها
 *
 * وهي مقيسةٌ من المصدر: ٢٣٧ عنوان `##` مقابل ٣٠ `###` في أربعةٍ وثلاثين إقليماً.
 */
import { slugify } from '@t3lm/kit/md';

export { slugify };

export interface HeadMark { title: string; depth: number; start: number; after: number }

function marks(body: string, depth: number): HeadMark[] {
  const re = new RegExp(`^#{${depth}}\\s+(.+)$`, 'gm');
  const out: HeadMark[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.push({ title: m[1]!.trim(), depth, start: m.index, after: re.lastIndex });
  return out;
}

export interface RawShot { title: string; id: string; raw: string; part?: string }
export interface RawRegion { heading: string; lead: string; shots: RawShot[]; parts: string[] }

const clean = (s: string) => s.replace(/^\s*---\s*$/gm, '').trim();

export function splitRegion(md: string): RawRegion {
  const text = md.replace(/\r\n/g, '\n');
  const h = text.match(/^#\s+(.+)$/m);
  const heading = h ? h[1]!.trim() : '';
  const body = h ? text.slice(text.indexOf(h[0]) + h[0].length) : text;

  const h2 = marks(body, 2);
  const h3 = marks(body, 3);
  const partsMode = h3.length > h2.length;

  const shotMarks = partsMode ? h3 : h2;
  const partMarks = partsMode ? h2 : [];
  const stops = [...shotMarks, ...partMarks].map((x) => x.start).sort((a, b) => a - b);

  const first = Math.min(
    ...[shotMarks[0]?.start, partMarks[0]?.start].filter((x): x is number => x !== undefined),
    body.length
  );

  const shots: RawShot[] = shotMarks.map((mk) => ({
    title: mk.title,
    id: slugify(mk.title),
    raw: clean(body.slice(mk.after, stops.find((s) => s > mk.start) ?? body.length)),
    part: partMarks.filter((p) => p.start < mk.start).at(-1)?.title,
  }));

  return { heading, lead: clean(body.slice(0, first)), shots, parts: partMarks.map((p) => p.title) };
}
