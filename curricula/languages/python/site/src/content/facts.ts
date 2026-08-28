/**
 * حقائق تُستخرَج من الماركداون، **ولا تُكتَب هنا** (الثابت ٤).
 *
 * اثنتان يقوم عليهما المدخل: **البديهيات الخمس** — عناوين لقطات الجزء الثاني من
 * الفصل صفر — و**سلّم النسب**: لوحةُ `runs: 01-four-numbers` التي يفحصها
 * `tools/verify.py`. فإن تغيّر رقمٌ في المنهج تغيّرت الصفحة معه.
 */
import { inline } from '../lib/md';
import { regions } from './regions';

/** `### الأولى — النوع صفةُ الكائن، لا صفةُ الاسم` ⇒ (ترتيب، نصّ). */
export const axioms: { ord: string; text: string }[] = (() => {
  const zero = regions.find((r) => r.n === 0);
  if (!zero) return [];
  return zero.shots
    .filter((s) => s.part?.includes('البديهيات') && s.title.includes('—'))
    .map((s) => {
      const [ord, ...rest] = s.title.split('—');
      return { ord: ord!.trim(), text: inline(rest.join('—').trim()) };
    });
})();

export type Rung = { name: string; x: number };

/**
 * سطرُ اللوحة: اسمٌ، فزمنٌ بوحدته، فنسبةٌ بعد `×`.
 * ولا يُقرأ الزمن — الريدمي يقول إن **النسبة هي الثابت**.
 */
export const ladder: Rung[] = (() => {
  const one = regions.find((r) => r.n === 1);
  for (const s of one?.shots ?? []) {
    for (const b of s.blocks) {
      if (b.t !== 'panel' || b.arg !== '01-four-numbers') continue;
      return b.text
        .split('\n')
        .map((l) => /^(.*?)\s{2,}[\d.,]+\s*µs\s+×\s*([\d.]+)\s*$/.exec(l.trim()))
        .filter((m): m is RegExpExecArray => m !== null)
        .map((m) => ({ name: m[1]!.trim(), x: Number(m[2]) }));
    }
  }
  return [];
})();

export type BindStep = {
  op: string;
  a: { addr: string; value: string };
  b: { addr: string; value: string };
};

/**
 * خطوات مختبر الرِّباط — من لوحة `runs: 02-binding`.
 * والعناوين حقيقيةٌ من تشغيلٍ واحد، وتختلف بين تشغيلين كما تقول اللوحة نفسها.
 */
export const bindingSteps: BindStep[] = (() => {
  const two = regions.find((r) => r.n === 2);
  const LINE = /^بعد\s+(.+?)\s*:\s*a→(0x[0-9a-f]+)\s+b→(0x[0-9a-f]+)\s+(\[[^\]]*\])\s+(\[[^\]]*\])\s*$/;
  for (const sh of two?.shots ?? []) {
    for (const b of sh.blocks) {
      if (b.t !== 'panel' || b.arg !== '02-binding') continue;
      return b.text
        .split('\n')
        .map((l) => LINE.exec(l.trim()))
        .filter((m): m is RegExpExecArray => m !== null)
        .map((m) => ({
          op: m[1]!.trim(),
          a: { addr: m[2]!, value: m[4]! },
          b: { addr: m[3]!, value: m[5]! },
        }));
    }
  }
  return [];
})();
