/**
 * حقائق تُستخرَج من الماركداون، **ولا تُكتَب هنا** (الثابت ٤).
 *
 * ثلاثٌ يقوم عليها المدخل: **القرارات** — عناوين أقسام «القرارات التي تفسّر شكل
 * اللغة» في الفصل `00` — و**الأحجام** من مخرَج `02-size`، و**خطوات الرِّباط** من
 * مخرَج `01-bind`. فإن تغيّر رقمٌ في المنهج تغيّرت الصفحة معه.
 */
import { inline } from '../lib/md';
import { regions } from './regions';

/** عناوين أقسام الجزء الذي يعدّد قرارات اللغة. */
export const decisions: string[] = (() => {
  const zero = regions.find((r) => r.n === 0);
  return (zero?.shots ?? [])
    .filter((s) => s.part?.includes('القرارات'))
    .map((s) => inline(s.title));
})();

export type Size = { what: string; bytes: number };

/**
 * السطران الأخيران من مخرَج `02-size`: قائمةُ ألفٍ ثم مصفوفةٌ حقيقية،
 * ومعهما وزنُ العدد الواحد من السطر الأول. **تُقرأ ولا تُكتَب.**
 */
export const sizes: Size[] = (() => {
  const two = regions.find((r) => r.n === 2);
  for (const sh of two?.shots ?? []) {
    for (const b of sh.blocks) {
      if (b.t !== 'panel' || b.kind !== 'out') continue;
      const rows = b.text.trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
      if (rows.length !== 3 || rows.some((r) => r.some(Number.isNaN))) continue;
      return [
        { what: 'العدد 1', bytes: rows[0]![1]! },
        { what: 'list فيها ألف عدد', bytes: rows[1]![2]! },
        { what: "array('q') فيها ألف عدد", bytes: rows[2]![0]! },
      ];
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
 * خطوات الرِّباط — من مخرَج `01-bind`. والعناوين حقيقيةٌ من تشغيلٍ واحد،
 * وتختلف بين تشغيلين كما يقول الفصل نفسه.
 */
export const bindingSteps: BindStep[] = (() => {
  const one = regions.find((r) => r.n === 1);
  const LINE =
    /^(.+?)\s{2,}a→(0x[0-9a-f]+)\s+b→(0x[0-9a-f]+)\s+(\[[^\]]*\])\s+(\[[^\]]*\])\s*$/;
  for (const sh of one?.shots ?? []) {
    for (const b of sh.blocks) {
      if (b.t !== 'panel' || b.arg !== '01-bind') continue;
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
