/**
 * وسم الآلة — **القناة الثانية للّون، وواحدةٌ لا ثلاث**: نصٌّ فقط، بلا أيقونة
 * وبلا حدٍّ ملوّنٍ ثالث (جمعُ ثلاث قنواتٍ يُنتج ضوضاءً بصرية، d = −0.32).
 *
 * والوسم إنجليزيّ فيبقى بالأحاديّ؛ ولا عربيّ فيه أبداً.
 */
import type { Machine } from '../lib/types';
import { MEANS } from '../lib/machine';

export function MachineTag({ machine, dir }: { machine: Machine; dir?: string }) {
  return (
    <span className="mtag en" data-machine={machine} title={MEANS[machine]}>
      {machine === '$' && dir ? `$ ${dir}/` : machine}
    </span>
  );
}
