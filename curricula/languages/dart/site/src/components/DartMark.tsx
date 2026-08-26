/**
 * علامة Dart — **الملفّ الرسميّ كما هو**، من مستودع `flutter/website`
 * (`sites/docs/web/assets/images/branding/dart/logo.svg`)، محفوظاً في
 * `public/dart.svg`.
 *
 * **ولا تُرسَم علامةٌ موجودة باليد.** المرتجَل لا يشبه الأصل ولا يدلّ عليه،
 * وألوانه ليست ألوان صاحبه. فيُستورَد الملفّ ويُعرَض بلا تعديل — ولذلك هو
 * `img` لا `svg` مضمَّناً: لا توكنز تمسّه ولا لونَ يُبدَّل.
 */
export function DartMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <img
      src="./dart.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className ? `mark ${className}` : 'mark'}
    />
  );
}
