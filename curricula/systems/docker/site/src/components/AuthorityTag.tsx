/**
 * وسم السلطة — **القناة الثانية للّون، وواحدةٌ لا ثلاث**: نصٌّ فقط، بلا أيقونة
 * وبلا حدٍّ ثالث (جمع ثلاث قنواتٍ يُنتج ضوضاءً بصرية، d = −0.32).
 *
 * والوسم إنجليزيّ فيبقى بالأحاديّ؛ ولا عربيّ فيه أبداً.
 */
import type { AuthorityTag as Tag } from '../lib/types';
import { authorityOf, MEANS } from '../lib/authority';

export function AuthorityTag({ tag }: { tag?: Tag | null }) {
  const t: Tag = tag ?? '@kernel';
  return (
    <span className="authtag en" data-auth={authorityOf(t)} title={MEANS[t]}>
      {t}
    </span>
  );
}
