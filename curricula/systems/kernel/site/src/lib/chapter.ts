/**
 * تقسيم ملفّ الفصل إلى لقطات — **لقطةٌ لكل `## `**.
 *
 * وأسماء المراحل ليست اختراع الموقع: الأسلوب `kernel-dfs` §٤ يعلن قالباً من
 * اثنتي عشرة مرحلة، وهي مكتوبةٌ في الماركداون عناوينَ `## ` — يتبعها أحياناً
 * `: ` وعنوانٌ فرعيّ. فيُقاس الاسم من الملفّ ولا يُعلَن في الكود.
 */
import { plain, slugify } from './md';

/** مراحل القالب بترتيبها في الأسلوب §٤. `التمرين` من `default` ويختم الفصل. */
export const TEMPLATE = [
  'المشكلة',
  'الصورة العامة',
  'الآلية الخام',
  'البنية الداخلية',
  'مسار التنفيذ',
  'أصغر implementation',
  'التجربة',
  'كسرها عمداً',
  'كيف تفعلها الأنظمة الحقيقية',
  'الفخاخ التصوّرية',
  'Checkpoint',
  'Artifact',
  'التمرين',
] as const;

export type StageName = (typeof TEMPLATE)[number];

/** يفصل عنوان القسم إلى مرحلةٍ من القالب وعنوانٍ فرعيّ بعد `: `. */
export function stageOf(titleMd: string): { stage: StageName | null; sub: string | null } {
  const t = plain(titleMd);
  for (const s of TEMPLATE) {
    if (t === s) return { stage: s, sub: null };
    if (t.startsWith(s + ':')) return { stage: s, sub: titleMd.slice(titleMd.indexOf(':') + 1).trim() };
  }
  return { stage: null, sub: null };
}

export interface RawShot { titleMd: string; body: string }

/** يعيد ترويسة الفصل، وما قبل أوّل `## `، وأقسامه. */
export function splitChapter(raw: string): { heading: string; lead: string; shots: RawShot[] } {
  let md = String(raw).replace(/\r\n/g, '\n');

  const h1 = md.match(/^#\s+(.+)$/m);
  const heading = h1 ? h1[1]!.trim() : '';
  if (h1) md = md.slice(h1.index! + h1[0].length);

  const first = md.search(/^##\s+/m);
  const lead = (first === -1 ? md : md.slice(0, first)).replace(/^\s*---\s*$/gm, '').trim();
  const rest = first === -1 ? '' : md.slice(first);

  const shots: RawShot[] = [];
  const re = /^##\s+(.+)$/gm;
  const marks: { titleMd: string; at: number; after: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest))) marks.push({ titleMd: m[1]!.trim(), at: m.index, after: re.lastIndex });

  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1]!.at : rest.length;
    const body = rest.slice(mk.after, end).replace(/^\s*---\s*$/gm, '').trim();
    shots.push({ titleMd: mk.titleMd, body });
  });

  return { heading, lead, shots };
}

/** عنوان الفصل بلا `الفصل NN — `. */
export function titleOf(heading: string): string {
  return heading.replace(/^الفصل\s+\S+\s*[—-]\s*/, '').trim();
}

export const idOf = (titleMd: string): string => slugify(plain(titleMd));
