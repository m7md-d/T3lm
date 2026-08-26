/**
 * فرق الإتقان: توقّعك الأوّل المحفوظ بجانب ما كان.
 * **بلا نسبةٍ وبلا صواب/خطأ** — الحكم للقارئ، ولا يُعرَف صواب جملةٍ كتبها بلغته.
 */
import { paintLines } from '../lib/dartlex';

export function MasteryDiff({ predicted, was }: { predicted: string; was: string }) {
  return (
    <div className="mastery">
      <div className="mastery__cell">
        <div className="mastery__label">ما توقّعتَه</div>
        <p>{predicted}</p>
      </div>
      <div className="mastery__cell">
        <div className="mastery__label">وما كان</div>
        <div className="panel__out en">
          {paintLines(was).map((l, i) => (
            <div className="oline" dir="auto" key={i} dangerouslySetInnerHTML={{ __html: l || '&nbsp;' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
