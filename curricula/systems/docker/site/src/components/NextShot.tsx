/**
 * الانتقال بضغطةٍ واحدة، في نفس الموضع دائماً، **ويسمّي ما بعده**: خطوةٌ محدّدة
 * رخيصة المظهر بدل قفزةٍ في المجهول (الركيزة ١٠). والاسم يُقرأ من عنوان اللقطة
 * القادمة في الماركداون، ولا يُختصَر بـ«التالي».
 */
import { ArrowLeft } from 'lucide-react';
import { inline } from '../lib/md';

export function NextShot({ title, onGo }: { title: string; onGo: () => void }) {
  return (
    <button type="button" className="next" onClick={onGo}>
      <ArrowLeft aria-hidden />
      <span>
        <span className="next__label">التالي</span>
        <br />
        <span className="next__title" dangerouslySetInnerHTML={{ __html: inline(title) }} />
      </span>
    </button>
  );
}
