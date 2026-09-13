/**
 * المراحل — من `../../../programs/stages.conf` حرفياً.
 *
 * وسطرُها `المرحلة | ملفّات النواة | وسائط QEMU | المهلة`. والمرحلة المنتهية
 * بـ`x` كسرٌ متعمَّد، وأصلُها ما قبل الحرف — فتُعرَض زوجاً معه.
 */
import type { Stage } from '../lib/types';

const conf = import.meta.glob('../../../programs/stages.conf', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const text = Object.values(conf)[0] ?? '';

export const stages: Stage[] = text
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const c = l.split('|').map((x) => x.trim());
    const id = c[0] ?? '';
    const broken = /x$/.test(id);
    return {
      id,
      broken,
      base: broken ? id.slice(0, -1) : id,
      files: (c[1] ?? '').split(/\s+/).filter(Boolean),
      qemu: c[2] ?? '',
      timeout: c[3] ?? '',
    };
  });

export const byId: Record<string, Stage> = Object.fromEntries(stages.map((s) => [s.id, s]));

/** ما دخل البناء وما خرج منه مقارنةً بالمرحلة المرقّمة قبله. */
export function delta(id: string): { added: string[]; removed: string[]; prev: string | null } {
  const s = byId[id];
  if (!s) return { added: [], removed: [], prev: null };
  const n = Number(s.base);
  let prev: Stage | undefined;
  for (let k = n - 1; k >= 1; k--) {
    const p = byId[String(k).padStart(2, '0')];
    if (p) { prev = p; break; }
  }
  if (!prev) return { added: s.files, removed: [], prev: null };
  const a = new Set(prev.files);
  const b = new Set(s.files);
  return {
    added: s.files.filter((f) => !a.has(f)),
    removed: prev.files.filter((f) => !b.has(f)),
    prev: prev.id,
  };
}
