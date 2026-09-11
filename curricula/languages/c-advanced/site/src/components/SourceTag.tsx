/**
 * وسمُ المصدر — **لونٌ + نصّ**، والقناة الثانية واحدةٌ لا ثالثة (أدلّة §٨).
 *
 * والفصل ٠٠ يوجبه: «فإن قرأتَ ادّعاءً ولم تعرف من يضمنه، فذلك عيبٌ في اللوحة».
 */
import { FAMILY_NAME, TAG_MEANS, TAG_TEXT } from '../lib/authority';
import type { Family, Tag } from '../lib/types';

export function SourceTag({ tag, family, note }: { tag: Tag; family: Family; note?: string }) {
  return (
    <span className={`src src-${family}`}>
      <span className="src-who">{FAMILY_NAME[family]}</span>
      <code className="src-tag en" title={TAG_MEANS[tag]}>{TAG_TEXT[tag]}</code>
      {note ? <span className="src-note">{note}</span> : null}
    </span>
  );
}
