/**
 * تصريف الماركداون. **يُصرَّف ولا يُفرَّع** (الثابت ٤): النصّ يبقى في
 * `../../regions/`، والموقع يعرضه ولا ينسخه.
 *
 * و`scripts/verify.mjs` يفرض ألّا يصل القارئ `**` ولا `` ` `` خارج
 * `pre`/`code`.
 */
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export const html = (md: string): string => marked.parse(md, { async: false }) as string;

/** سطرٌ واحد بلا `<p>` — للعناوين وخلايا الجداول المستخرَجة. */
export const inline = (md: string): string => marked.parseInline(md, { async: false }) as string;

/** نصٌّ صِرف — لعنوان التبويب ولقارئ الشاشة. */
export function plain(md: string): string {
  return md
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim();
}

export const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * مُعرّفٌ مطابق لخوارزمية GitHub — لتعمل الروابط الداخلية التي كتبها المنهج.
 * `\p{M}` تبقى (التشكيل يغيّر المرساة)، وكل مسافة تصير شرطةً على حدة.
 */
export const slugify = (s: string): string =>
  String(s).trim().toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .replace(/\s/g, '-');

/** عددُ كلمات النثر — لفحص حدّ اللقطة. */
export function words(md: string): number {
  const t = md.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]*>/g, ' ');
  return (t.match(/[\p{L}\p{N}][\p{L}\p{N}_'’ـ-]*/gu) ?? []).length;
}
