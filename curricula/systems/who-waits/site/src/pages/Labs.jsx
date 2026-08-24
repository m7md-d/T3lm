import { Link } from 'react-router-dom';
import { LABS } from '../widgets/index.js';
import { bySlug } from '../content/index.js';

/**
 * فهرسة المختبرات فقط — كلٌّ منها يعيش **بعد الخطوة التي يستحقّها** داخل إقليمه،
 * لأن الأثر التعليمي يأتي من التجريب فور القراءة لا من صفحةٍ منفصلة.
 */
export default function Labs() {
  return (
    <div className="wrap">
      <section className="cover">
        <div className="eyebrow">فهرس</div>
        <h1 style={{ fontSize: 'clamp(26px,4.2vw,40px)' }}>المختبرات</h1>
        <p className="sub">
          كل مختبرٍ هنا = <b>ادّعاءٌ سببيٌّ من المنهج</b> + مُدخَلٌ تملكه أنت + نتيجةٌ تتغيّر
          أمامك. لا واحد منها يعرض ما قاله النصّ؛ كلٌّ منها يسمح لك بأن تكسره.
        </p>
      </section>

      <div className="threads">
        {LABS.map((l) => {
          const r = bySlug[l.region];
          return (
            <Link
              key={l.id}
              to={`${r.path}?s=${encodeURIComponent('الدرس')}`}
              className="thread"
              style={{ '--accent': r.color }}
            >
              <span className="n" style={{ color: r.color }}>
                {r.id}
              </span>
              <span className="tx">
                <b>{l.name}</b>
                <span>{l.claim}</span>
              </span>
              <span className="hits">
                <span className="pin" style={{ '--c': r.color }}>
                  {r.title}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <p className="lede" style={{ marginBlockStart: 26, color: 'var(--fg-3)', fontSize: 14 }}>
        الروابط تفتح محطّة «الدرس» في إقليم المختبر؛ تنقّل بين الخطوات حتى تصل إليه — أو
        استعمل <span className="en">⌘K</span>.
      </p>
    </div>
  );
}
