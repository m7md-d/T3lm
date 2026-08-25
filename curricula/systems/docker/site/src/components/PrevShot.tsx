/** رجوعٌ خطوةً — ملاحةٌ لا تقدّم، فتبقى خافتةً بجانب زرّ التالي. */
import { ArrowRight } from 'lucide-react';

export function PrevShot({ onGo }: { onGo: () => void }) {
  return (
    <button type="button" className="copybtn" onClick={onGo}>
      <ArrowRight aria-hidden />
      <span>السابقة</span>
    </button>
  );
}
