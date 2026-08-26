/**
 * تصريف الماركداون إلى HTML. **يُصرَّف ولا يُفرَّع**: النصّ يبقى في
 * `../../../regions/`، والموقع يعرضه ولا ينسخه.
 *
 * وفحصٌ في `../../scripts/ssr-check.tsx` يفرض ألّا يصل القارئ `**` ولا
 * `` ` `` خارج `pre`/`code`.
 */
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export const html = (md: string): string => marked.parse(md, { async: false }) as string;

/** سطرٌ واحد بلا `<p>` — للعناوين وخلايا الجداول المستخرَجة. */
export const inline = (md: string): string => marked.parseInline(md, { async: false }) as string;

/** الأرقام العربية-الهندية في المصدر ⇒ رقمُ إقليمٍ في المسار. */
const AR = '٠١٢٣٤٥٦٧٨٩';
export const toLatinDigits = (s: string): string =>
  s.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
