/**
 * تقسيم الإقليم إلى لقطات — **بقاعدةٍ تُقاس من الملفّ لا تُعلَن في الكود**.
 *
 * العدّة تعتبر أيّ `###` علامةَ أجزاء، وهي قاعدةٌ لا تصحّ هنا: اثنا عشر إقليماً
 * في هذا المنهج فيه `###` واحدةٌ فقط — تعليلاً **داخل** اللقطة. فالقاعدة نسبيّة:
 *
 *   `###` أكثر من `##`  ⇒  `##` جزءٌ و`###` لقطة   (الفصل صفر: ٣١ مقابل ٤)
 *   وإلّا                ⇒  `##` لقطة و`###` مقطعٌ بداخلها
 *
 * وهي مقيسةٌ من المصدر: ١٩١ عنوان `##` مقابل ٤٩ `###` في ثلاثةٍ وعشرين إقليماً،
 * و٣١ من الـ`###` في الفصل صفر وحده.
 */
import { slugify } from '@t3lm/kit/md';

export { slugify };

interface Mark { title: string; start: number; after: number }

function marks(body: string, depth: number): Mark[] {
  const re = new RegExp(`^#{${depth}}\\s+(.+)$`, 'gm');
  const out: Mark[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.push({ title: m[1]!.trim(), start: m.index, after: re.lastIndex });
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
