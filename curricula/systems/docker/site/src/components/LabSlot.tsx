/**
 * موضع مختبرٍ محقونٍ **بعد اللقطة التي أنتجت ادّعاءه بالضبط**، لا في صفحةٍ
 * مجموعة. وفحصٌ آليٌّ يفرض أن يطابق كلُّ تعريفٍ خطوةً واحدة — لا صفر ولا اثنتين
 * — وإلّا انجرفت المختبرات عن مواضعها بصمتٍ عند أوّل تعديلٍ في النصّ.
 *
 * والفرق يُعلَن: ما بداخله محاكاةٌ لا نواة.
 */
export function LabSlot({
  name, claim, children,
}: { name: string; claim: string; children: React.ReactNode }) {
  return (
    <section className="labslot">
      <header className="labslot__bar">
        <strong>{name}</strong>
        <span className="labslot__claim">{claim}</span>
      </header>
      <div className="labslot__body">{children}</div>
      <p className="labslot__sim">محاكاة. النواة ليست في المتصفّح، والأرقام هنا تتبع النموذج المشروح في الإقليم.</p>
    </section>
  );
}
