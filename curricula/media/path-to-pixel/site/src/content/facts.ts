/**
 * حقائق تُستخرَج من الماركداون ومن ملفّات الأشكال، **ولا تُكتَب هنا** (الثابت ٤).
 *
 * وكلُّ ما دونها يُفشِل فحصَ الدخان إن غاب: الصفحةُ الأولى والمختبراتُ تقوم
 * عليها، فإن تغيّر رقمٌ في المنهج تغيّرت معه.
 */
import { inline } from '../lib/md';
import { regions } from './regions';
import type { Block } from '../lib/types';

const panels = (n: number, arg?: string): Extract<Block, { t: 'panel' }>[] => {
  const r = regions.find((x) => x.n === n);
  const out: Extract<Block, { t: 'panel' }>[] = [];
  for (const s of r?.shots ?? [])
    for (const b of s.blocks)
      if (b.t === 'panel' && (!arg || b.arg === arg)) out.push(b);
  return out;
};

/** `### الأولى — البكسل عيّنةٌ لا مربّع` ⇒ (ترتيب، نصّ). */
export const axioms: { ord: string; text: string }[] = (() => {
  const zero = regions.find((r) => r.n === 0);
  return (zero?.shots ?? [])
    .filter((s) => s.part?.includes('البديهيات') && s.title.includes('—'))
    .map((s) => {
      const [ord, ...rest] = s.title.split('—');
      return { ord: ord!.trim(), text: inline(rest.join('—').trim()) };
    });
})();

export type Rung = { shape: string; off: number; total: number; authority: string };

/** سلّمُ التشخيص: ثلاثةُ أشكالٍ ضدّ Skia، ولكلٍّ سلطتُه. */
export const ladder: Rung[] = (() => {
  const zero = regions.find((r) => r.n === 0);
  const out: Rung[] = [];
  for (const s of zero?.shots ?? []) {
    if (!s.part?.includes('سلطات')) continue;
    for (const b of s.blocks) {
      if (b.t !== 'panel' || b.kind !== 'ref') continue;
      const m = /بكسلات تتجاوز الحدّ \(\d+\):\s*(\d+)\s*من\s*(\d+)/.exec(b.text);
      if (!m) continue;
      out.push({
        shape: inline(s.title.split('—')[0]!.trim()),
        off: Number(m[1]),
        total: Number(m[2]),
        authority: b.authority ?? 'math',
      });
    }
  }
  return out;
})();

export type Bar = { y: number; w: number; rowA: number; covA: number; rowB: number; covB: number; ink: number };

/** مختبرُ الرقيق: ستُّ حالاتٍ مقيسة من لوحة `15-hairline`. */
export const hairline: Bar[] = (() => {
  const LINE =
    /y=([\d.]+)\s+عرض\s+([\d.]+)\s+→\s+الصفّ\s+(\d+):\s*([\d.]+)\s+الصفّ\s+(\d+):\s*([\d.]+)\s+حبر:\s*([\d.]+)/;
  const out: Bar[] = [];
  for (const p of panels(15, undefined))
    for (const ln of p.text.split('\n')) {
      const m = LINE.exec(ln);
      if (m)
        out.push({
          y: Number(m[1]), w: Number(m[2]),
          rowA: Number(m[3]), covA: Number(m[4]),
          rowB: Number(m[5]), covB: Number(m[6]),
          ink: Number(m[7]),
        });
    }
  return out;
})();

export type Winding = { shape: string; cross: number; wind: number; nz: number; eo: number };

/** مختبرُ القاعدة: أربعةُ أشكالٍ من لوحة `05-winding`. */
export const winding: Winding[] = (() => {
  const LINE = /^\s*([a-z-]+)\s+(\d+)\s+([+-]\d+)\s+(\d+)\s+(\d+)/;
  const out: Winding[] = [];
  for (const p of panels(5))
    for (const ln of p.text.split('\n')) {
      const m = LINE.exec(ln);
      if (m) out.push({ shape: m[1]!, cross: Number(m[2]), wind: Number(m[3]), nz: Number(m[4]), eo: Number(m[5]) });
    }
  return out;
})();

export type Sample = { height: number; s1: number; s4: number; s16: number; area: number };

/** مختبرُ العيّنات: جدولُ الشريط الأفقيّ من لوحة `08-super`. */
export const samples: Sample[] = (() => {
  const LINE = /^\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$/;
  const out: Sample[] = [];
  for (const p of panels(8))
    for (const ln of p.text.split('\n')) {
      const m = LINE.exec(ln);
      if (m && Number(m[1]) < 1)
        out.push({ height: Number(m[1]), s1: Number(m[2]), s4: Number(m[3]), s16: Number(m[4]), area: Number(m[5]) });
    }
  return out;
})();

/** ملفّات الأشكال — نفسُ الهندسة التي يقرؤها C وSkia. */
const shapeFiles = import.meta.glob('../../../shapes/*.path', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

/** `M x y` · `L x y` · `C …` · `Z` ⇒ سلسلةُ `d` لعنصر SVG. */
export const shapes: Record<string, string> = Object.fromEntries(
  Object.entries(shapeFiles).map(([p, raw]) => [
    /([^/]+)\.path$/.exec(p)![1]!,
    raw.trim().split(/\s*\n\s*/).join(' '),
  ])
);
