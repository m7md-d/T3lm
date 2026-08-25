/**
 * تلوين الصَّدَفة — انظر `@t3lm/kit/highlight` للميكانيزم والقاعدة.
 *
 * **المحلّل من CodeMirror** (`StreamLanguage` فوق نمط الصَّدَفة القديم): لا محلّل
 * lezer للصَّدَفة في المنظومة، والنمط القديم هو ما يستعمله المحرّر نفسه. والبديل
 * — تعبيراتٌ نمطية مرتجَلة — يُخطئ عند أوّل سلسلةٍ فيها `#` فيقرأ القارئ لوناً
 * يكذب عليه.
 *
 * وهو موضعه العدّة لأنه ميكانيزم يتكرّر: كل منهج أنظمةٍ يعرض أوامر صَدَفة.
 */
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { escapeOnly, highlightWith } from './index';

const SH = StreamLanguage.define(shell);
const DOCKER = StreamLanguage.define(dockerFile);

export function highlightToHtml(code: string, lang = 'sh'): string {
  if (lang === 'sh' || lang === 'bash' || lang === 'shell') return highlightWith(SH.parser, code);
  if (lang === 'dockerfile' || lang === 'Dockerfile') return highlightWith(DOCKER.parser, code);
  return escapeOnly(code);
}
