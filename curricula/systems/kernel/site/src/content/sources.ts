/**
 * مصادر النواة — ما يشير إليه `<!-- part: … -->` تحت `../../../programs/`:
 * `kernel/` و`variants/` و`demos/` و`host/`.
 * **المصدر الوحيد** (الثابت ٤): تُقرأ من مكانها ولا تُنسَخ هنا.
 */
const raw = import.meta.glob('../../../programs/{kernel,variants,demos,host}/**/*.{c,h,S,ld}', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

/** `kernel/switch.S` → نصُّ الملفّ، بنفس المسار الذي يكتبه `<!-- part: … -->`. */
export const files: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([p, s]) => [p.replace(/^.*\/programs\//, ''), s]),
);

export const fileOf = (path: string | null): string | null =>
  (path && files[path]) ?? null;

/**
 * معجمُ أسماءِ كودِنا — يُستخرَج من المصادر نفسها لا من قائمةٍ مكتوبة بيد.
 * وهو نصف معجم تلوين المخرَج: الاسمُ الذي عرّفه كودُنا يأخذ لون `@ours`.
 */
export const ourNames: Set<string> = (() => {
  const s = new Set<string>();
  for (const src of Object.values(files)) {
    for (const m of src.matchAll(/\b([A-Za-z_][A-Za-z0-9_]{2,})\b/g)) s.add(m[1]!);
  }
  return s;
})();
