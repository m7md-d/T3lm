/**
 * برامج `../../../programs/` — تُحمَّل **كسولاً**، فلا يدخل منها الحزمةَ الأولى
 * شيء. والماركداون يعرض مقتطعاً، وهذا هو الملفّ الذي أنتج المخرَج.
 */
const mods = import.meta.glob('../../../programs/**/*.{c,h,sh,stdin}', {
  query: '?raw', import: 'default',
}) as Record<string, () => Promise<string>>;

const PREFIX = '../../../programs/';

const all = Object.keys(mods).map((p) => p.slice(PREFIX.length)).sort();

/** ملفّات برنامجٍ باسمه: `24-mp` ⇒ `24-mp.c` · `14-elf` ⇒ ما في مجلّده. */
export function filesOf(name: string): string[] {
  const dir = all.filter((p) => p.startsWith(`${name}/`));
  if (dir.length) return dir;
  return all.filter((p) => p === `${name}.c`);
}

export const load = (rel: string): Promise<string> => {
  const f = mods[PREFIX + rel];
  return f ? f() : Promise.resolve('');
};

export const langOf = (rel: string): string =>
  rel.endsWith('.c') || rel.endsWith('.h') ? 'c' : 'text';

export const programCount = all.length;
