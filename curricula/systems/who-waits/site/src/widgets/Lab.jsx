/**
 * إطار المختبر المشترك — انسخه كما هو، وصمّم أنماطه (`.lab`, `.chip`, `.stat`)
 * من جدول الاشتقاق الخاص بمنهجك. البنية ثابتة، المظهر يُشتقّ.
 *
 * العقد: كل مختبر يعيد <Lab> واحدة، ويتلقّى مُدخَلاً من المستخدم، ويُظهر نتيجة
 * تتغيّر بتغيّره. مختبرٌ بلا مُدخَل ليس مختبراً.
 */
export default function Lab({ title, tag, note, children, accent }) {
  return (
    <section className="lab" style={accent ? { '--accent': accent } : undefined}>
      <div className="lab-head">
        <span className="dot" />
        <h4>{title}</h4>
        {tag && <span className="tag">{tag}</span>}
      </div>
      <div className="lab-body">{children}</div>
      {note && <div className="lab-note">{note}</div>}
    </section>
  );
}

/** مفتاح تبديل: الوحدة الأساسية لِـ«اقلب مُدخَلاً وشاهد الادّعاء يتحقّق» */
export function Chip({ on, onClick, color, title, children }) {
  return (
    <button
      className={`chip${on ? ' on' : ''}`}
      style={color ? { '--c': color } : undefined}
      onClick={onClick}
      title={title}
      type="button"
    >
      <span className="sw" />
      {children}
    </button>
  );
}

/** قيمة مقروءة تتغيّر مع المُدخَل — `tone` للحالات (ok / warn / bad) */
export function Stat({ k, v, unit, tone }) {
  return (
    <div className={`stat${tone ? ` ${tone}` : ''}`}>
      <span className="k">{k}</span>
      <span className="v">
        {v}
        {unit && <small> {unit}</small>}
      </span>
    </div>
  );
}

/** حكمٌ نهائي يظهر بعد أن يضبط القارئ المُدخَلات — نصّ الدرس لا نصّ الحالة */
export function Verdict({ tone = 'ok', children }) {
  return <div className={`verdict ${tone}`}>{children}</div>;
}
