/**
 * تقسيم الفصل إلى أقسام — **بقاعدةٍ تُقاس من الملفّ لا تُعلَن في الكود.**
 *
 * العدّة تعتبر وجود أيّ `###` علامةَ أجزاء، وهي قاعدةٌ صحّت لمناهجَ يظهر فيها
 * `###` في الفصل صفر وحده. وهذا المنهج يستعمله ثلاث مرّاتٍ فقط، وكلُّها
 * **داخل** قسم (`16` و`25` و`26`) — فالقاعدة هنا نسبيّة:
 *
 *   `###` أكثر من `##`  ⇒  `##` جزءٌ و`###` قسم
 *   وإلّا                ⇒  `##` قسمٌ و`###` مقطعٌ بداخله
 *
 * والمقيس في هذا المنهج: ١٤٦ عنوان `##` مقابل ٣ عناوين `###`.
 */
import { slugify } from '@t3lm/kit/md';

export { slugify };

interface Mark { title: string; start: number; after: number }

function marksOf(body: string, depth: number): Mark[] {
  const re = new RegExp(`^#{${depth}}\\s+(.+)$`, 'gm');
  const out: Mark[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.push({ title: m[1]!.trim(), start: m.index, after: re.lastIndex });
  return out;
}

/** الفاصل `---` بنيةٌ في المصدر لا محتوًى، والأقسام تفصل بدله. */
const clean = (s: string) => s.replace(/^\s*---\s*$/gm, '').trim();

export interface RawShot { title: string; id: string; raw: string }
export interface RawChapter { heading: string; lead: string; shots: RawShot[] }

export function splitChapter(md: string): RawChapter {
  const text = md.replace(/\r\n/g, '\n');
  const h = text.match(/^#\s+(.+)$/m);
  const heading = h ? h[1]!.trim() : '';
  const body = h ? text.slice(text.indexOf(h[0]) + h[0].length) : text;

  const h2 = marksOf(body, 2);
  const h3 = marksOf(body, 3);
  const marks = h3.length > h2.length ? h3 : h2;

  const first = marks[0]?.start ?? body.length;
  const shots: RawShot[] = marks.map((mk, i) => ({
    title: mk.title,
    id: slugify(mk.title),
    raw: clean(body.slice(mk.after, marks[i + 1]?.start ?? body.length)),
  }));

  return { heading, lead: clean(body.slice(0, first)), shots };
}

/** `الفصل ٠٠ — الخريطة والمصادر` ⇒ `الخريطة والمصادر` */
export const titleOf = (heading: string): string =>
  heading.replace(/^الفصل\s+\S+\s*—\s*/, '').trim() || heading;
