/**
 * تصريف الماركداون. **يُصرَّف ولا يُفرَّع** (الثابت ٤): النصّ يبقى في
 * `../../regions/`، والموقع يعرضه ولا ينسخه.
 *
 * و`scripts/verify.mjs` يفرض ألّا يصل القارئ `**` ولا `` ` `` خارج
 * `pre`/`code`.
 */
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

/**
 * علامةٌ تتكرّر اثنتين وثلاثين مرّة بشكلٍ قابلٍ للتحليل ⇒ مكوّن لا تنسيق:
 * الفقرة التي تبدأ بـ`⚠` **حدٌّ على الادّعاء الذي قبلها** — أنّ التشغيل شاهدٌ
 * لا برهان، أو أنّ الضمان من جهةٍ غير التي يظنّها القارئ، أو أنّ النتيجة
 * لا تنتقل. والرمز نفسه قناتُها الثانية، فلا تحتاج لوناً خامساً.
 */
const LIMIT = /<p>⚠\s*/g;

/** كتلةٌ كاملة: فقرات وقوائم وجداول واقتباسات. */
export const html = (md: string): string =>
  (marked.parse(md, { async: false }) as string).replace(LIMIT, '<p class="limit"><span class="limit-m" aria-hidden="true">⚠</span>');

/** سطرٌ واحد بلا `<p>` — للعناوين وخلايا الجداول المستخرَجة. */
export const inline = (md: string): string => marked.parseInline(md, { async: false }) as string;

/** نصٌّ صِرف — للعنوان في الشريط وفي `<title>`. */
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

/** عددُ كلمات النثر — لميزانية «توقّع المخرَج» في فحص المحتوى. */
export const words = (md: string): number =>
  plain(md.replace(/```[\s\S]*?```/g, '')).split(/\s+/).filter(Boolean).length;
