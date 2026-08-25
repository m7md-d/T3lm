/**
 * الموتيف — **بطاقة العملية**، وهي السطر الختاميّ للمنهج نفسه:
 * «تسمع بدلها: نطاقاتٌ، وشجرة جبل، وملفُّ حدود، وقائمةُ قدرات» (الإقليم ٣٣).
 *
 * ولهذا **لا صندوق ولا مكعّب ولا حوت في هذا الموقع**: الإقليم ٠٧ يدفن نموذج
 * الصندوق، ورسمُه في الترويسة يهدمه قبل أن يُقرأ.
 *
 * والحقول الأربعة **بلا لونٍ دلاليّ** — ميزانية اللون كلُّها لسلّم السلطة.
 * وحين يكون إقليمٌ حاصلَ ضرب حقلين (١٩ = نطاق مستخدمين × قدرات) يُضاء الحقلان
 * معاً: التركيب يُعرَض بنيةً لا بمزيج لون.
 */
export const FIELDS = ['نطاقات', 'شجرة جبل', 'ملفُّ حدود', 'قائمةُ قدرات'] as const;
export type Field = (typeof FIELDS)[number];

/** واجهة النواة التي يسكنها كلُّ حقل — أسماءٌ من النواة لا من نصّ المنهج. */
export const WHERE: Record<Field, string> = {
  'نطاقات': '/proc/<pid>/ns/',
  'شجرة جبل': 'pivot_root(2)',
  'ملفُّ حدود': '/sys/fs/cgroup/',
  'قائمةُ قدرات': 'capabilities(7)',
};

export function ProcessCard({
  on = [], values = {},
}: { on?: Field[]; values?: Partial<Record<Field, string>> }) {
  return (
    <div className="proccard" role="img" aria-label="العملية بحقولها الأربعة">
      {FIELDS.map((f) => (
        <div className="proccard__f" key={f} data-on={on.includes(f)}>
          <span className="proccard__name">{f}</span>
          <span className="proccard__val en">{values[f] ?? WHERE[f]}</span>
        </div>
      ))}
    </div>
  );
}
