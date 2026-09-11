/**
 * كيف تحقّق الفاحص من هذه اللوحة — **لا هل «نجحت».**
 * والفرق مشروحٌ في `../lib/grade.ts`، ومصدرُه حكمُ الغياب في README المنهج.
 */
import { GRADE_LABEL, GRADE_MEANS } from '../lib/grade';
import type { Grade } from '../lib/types';

export function GradeTag({ grade }: { grade: Grade }) {
  return (
    <span className={`grade grade-${grade}`} title={GRADE_MEANS[grade]}>
      {GRADE_LABEL[grade]}
    </span>
  );
}
