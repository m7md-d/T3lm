/**
 * فرق الإتقان: توقّعك الأوّل المحفوظ بجانب ما كان.
 *
 * **بلا نسبةٍ وبلا صواب/خطأ** — الحكم للقارئ، ولا يُعرَف صواب جملةٍ كتبها بلغته.
 * وهو بديل التلعيب: اكتشافٌ ذاتيٌّ للقدرة لا نقاط (الأسلوب §١١).
 */
export function MasteryDiff({ predicted, was }: { predicted: string; was: string }) {
  return (
    <div className="mastery">
      <div className="mastery__cell">
        <div className="mastery__label">ما توقّعتَه</div>
        <p>{predicted}</p>
      </div>
      <div className="mastery__cell">
        <div className="mastery__label">وما كان</div>
        <pre className="panel__body en" style={{ padding: 0 }}>{was}</pre>
      </div>
    </div>
  );
}
