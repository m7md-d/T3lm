/**
 * تلوين Dart — انظر `@t3lm/kit/highlight` للميكانيزم والقاعدة.
 *
 * **المحلّل من CodeMirror** (`StreamLanguage` فوق نمط `clike`): لا محلّل lezer
 * لـDart في المنظومة، ونمط `clike` هو ما يستعمله المحرّر نفسه لها. ويعرف
 * كلماتها المحجوزة كلَّها بما فيها `late` و`sealed` و`mixin` و`await`.
 *
 * ومعه `yaml`: `pubspec.yaml` جزءٌ من عدّة Dart لا لغةٌ أخرى تُعرَض، وأربع
 * لوحاتٍ منه لا تستحقّ مدخلاً مستقلّاً يحمله كل منهج.
 */
import { StreamLanguage } from '@codemirror/language';
import { dart } from '@codemirror/legacy-modes/mode/clike';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { escapeOnly, highlightWith } from './index';

const DART = StreamLanguage.define(dart);
const YAML = StreamLanguage.define(yaml);

export function highlightToHtml(code: string, lang = 'dart'): string {
  if (lang === 'dart') return highlightWith(DART.parser, code);
  if (lang === 'yaml' || lang === 'yml') return highlightWith(YAML.parser, code);
  return escapeOnly(code);
}
