/**
 * الانتقال بضغطةٍ واحدة، في نفس الموضع دائماً، **ويسمّي ما بعده**: خطوةٌ محدّدة
 * رخيصة المظهر بدل قفزةٍ في المجهول. والاسم عنوان اللقطة القادمة من الماركداون.
 */
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { inline } from '../lib/md';

export function NextShot({ title, onGo }: { title: string; onGo: () => void }) {
  return (
    <button type="button" className="next" onClick={onGo}>
      <ArrowLeft aria-hidden />
      <span>
        <span className="next__label">التالية</span>
        <span className="next__title" dangerouslySetInnerHTML={{ __html: inline(title) }} />
      </span>
    </button>
  );
}

/** رجوعٌ خطوةً — ملاحةٌ لا تقدّم، فتبقى خافتةً بجانب زرّ التالي. */
export function PrevShot({ onGo }: { onGo: () => void }) {
  return (
    <button type="button" className="copybtn" onClick={onGo}>
      <ArrowRight aria-hidden />
      <span>السابقة</span>
    </button>
  );
}
