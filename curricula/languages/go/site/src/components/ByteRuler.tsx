/**
 * مسطرة البايتات — الموتيف التوقيعي للمنهج.
 *
 * اشتقاق: الإقليم ٠١ يقول إن جدول الأحجام «خريطة نصف اللغة»، ويعدّ بالكلمة
 * (٨ بايت). فالفواصل هنا ليست خطوطاً زخرفية بل **مقياس إزاحة** بترقيم ستّ عشري
 * كما يظهر في أي hex dump — ٠٠ ٠٨ ١٠ ١٨ ٢٠…
 */
export default function ByteRuler({ words = 8, label }: { words?: number; label?: string }) {
  return (
    <div className="ruler" aria-hidden="true">
      {Array.from({ length: words }, (_, i) => (
        <span key={i} className="ruler-cell" style={{ ['--i' as string]: i }}>
          <b>{(i * 8).toString(16).padStart(2, '0')}</b>
        </span>
      ))}
      {label && <span className="ruler-label">{label}</span>}
    </div>
  );
}
