/**
 * تصريف الماركداون إلى HTML. **يُصرَّف ولا يُفرَّع**: النصّ يبقى في
 * `../../regions/`، والموقع يعرضه ولا ينسخه.
 *
 * وفحصٌ آليٌّ لاحق يفرض ألّا يصل القارئ `**` ولا `` ` `` خارج `pre`/`code`.
 */
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

/** كتلةٌ كاملة (فقرات وقوائم وجداول). */
export const html = (md: string): string => marked.parse(md, { async: false }) as string;

/** سطرٌ واحد بلا `<p>` — للعناوين وخلايا الجداول المستخرَجة. */
export const inline = (md: string): string => marked.parseInline(md, { async: false }) as string;

/**
 * `…` في اللوحة ادّعاءٌ لا حذف: تطابق أيّ شيء، فما حولها وحده مضمون.
 * تُصيَّر عنصراً مميَّزاً بدل أن تُقرأ نقاطَ حذف.
 */
export function markWildcards(output: string): string {
  const esc = output
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc.replace(/…/g, '<span class="wild" title="تطابق أيّ شيء — غير مضمون">…</span>');
}
