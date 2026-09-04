/**
 * المدخل — صفحةُ هبوطٍ لمن لا يعرف الموضوع بعد.
 *
 * ترتيبُها: مشهدٌ افتتاحيّ ⇒ ما هذا بجملتين بلا مصطلح ⇒ **لحظةُ تفاعلٍ واحدة**
 * يقلب فيها القارئ الادّعاء بيده ⇒ جوهر المنهج معروضاً (الضوامن الأربعة
 * والانهيارات الثلاثة) ⇒ الطريق مجمَّعاً ⇒ العمقُ مطويّاً حتى يُطلَب.
 *
 * ولا جدارَ كودٍ في أوّل شاشة، ولا مصطلحَ مبهمٍ فيها.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Lab } from '../components/Lab';
import { Mark } from '../components/Mark';
import { TopBar } from '../components/TopBar';
import { collapses, guarantors, packs } from '../content/facts';
import { regions } from '../content/regions';
import { store } from '../lib/store';

export function Home() {
  const [deep, setDeep] = useState(false);
  const last = store.lastRegion();
  const resume = last ? regions.find((r) => r.num === last) : undefined;

  return (
    <>
      <TopBar />
      <main className="wrap home" id="main">
        <section className="hero">
          <div className="hero__mark"><Mark size={34} /></div>
          <h1>ملفٌّ يمرّ، ومعناه مستحيل</h1>
          <p className="hero__sub">
            أنت تصمّم شكلَ ملفّ: ماذا يُكتَب فيه، وما الذي يُقبَل، وما الذي يُرفَض
            ولماذا. وهذا المنهج يبني لغةً صغيرة من الصفر — نصٌّ يكتبه إنسان، يصير
            بنيةً، ثم صورة — ويقف عند كلّ قرارٍ ليسأل: <b>من يضمن هذا؟</b>
          </p>
          <div className="row" style={{ marginBlockStart: '1.5rem' }}>
            <Link className="btn btn--go" to="/r/00/0">ابدأ من الفصل ٠٠</Link>
            {resume && (
              <Link className="btn" to={`/r/${resume.num}/${store.lastShot(resume.num)}`}>
                عُد إلى الفصل {resume.num}
              </Link>
            )}
          </div>
        </section>

        <section className="stack" style={{ marginBlockEnd: '3rem' }}>
          <p className="stage">
            <b>نصّ</b> ⇐ <b>رموز</b> ⇐ <b>شجرة</b> ⇐ <b>بنية</b> ⇐ <b>صورة</b>
            <span>· اكتب في الصندوق وانظر أين تتوقّف السلسلة</span>
          </p>
          <Lab
            id="home"
            stage="picture"
            claim="غيِّر اسماً أو نوعاً: إمّا صورةٌ، وإمّا رفضٌ يقول أيَّ سطرٍ وأيَّ عمود."
            seeds={['valid/01-minimal.dsl', 'valid/03-chain.dsl', 'invalid/03-port-mismatch.dsl']}
          />
          <p className="kicker prose-wrap">
            المنفّذ هنا نقلُ برامج المنهج إلى المتصفّح، وقد فُحص أنّه يعطي نصَّ الرفض
            وموضعَه كما تعطيه <span className="en">python3</span> حرفاً بحرف. والصورة
            بتخطيط الـ<span className="en">epitome</span> من الفصل ٠٠.
          </p>
        </section>

        <section style={{ marginBlockEnd: '3rem' }}>
          <h2>من يضمن؟</h2>
          <p className="prose-wrap" style={{ marginBlock: '0.6rem 1.2rem', color: 'var(--ink-2)' }}>
            كلُّ قاعدةٍ في ملفّك يضمنها واحدٌ من أربعة. وثلاثةٌ منها لها أثرٌ في
            الكود، والرابع دَينٌ لا يظهر في مراجعةٍ ولا يسقط في اختبار.
          </p>
          <div className="who">
            {guarantors.map((g) => (
              <div className={`who__row who__row--${g.id}`} key={g.id}>
                <div className="who__tag">{g.tag}</div>
                <div className="who__meaning" dangerouslySetInnerHTML={{ __html: g.meaning }} />
                <div className="who__gives">عند المخالفة: {g.gives}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBlockEnd: '3rem' }}>
          <h2>ثلاثة انهيارات، وهي جدول الطريق</h2>
          <p className="prose-wrap" style={{ marginBlock: '0.6rem 1.2rem', color: 'var(--ink-2)' }}>
            الفصل ٠٠ يبني أداةً تعمل في أقلّ من خمسين سطراً، ثم يكسرها ثلاث مرّات.
            وكلُّ كسرةٍ تُعالَج في موضعها من الطريق.
          </p>
          <div className="breaks">
            {collapses.map((c, i) => (
              <div className="break" key={c.name}>
                <span className="break__n">{i + 1}</span>
                <span className="break__name">{c.name}</span>
                <span className="break__sym">{c.symptom}</span>
                <span className="break__dies" dangerouslySetInnerHTML={{ __html: `يموت في ${c.dies}` }} />
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBlockEnd: '3rem' }}>
          <h2>الطريق</h2>
          <div className="grid-packs" style={{ marginBlockStart: '1.1rem' }}>
            {packs.map((p) => (
              <Link className="pack" to={`/r/${String(p.from).padStart(2, '0')}/0`} key={p.name}>
                <span className="pack__no">
                  {String(p.from).padStart(2, '0')}
                  {p.to !== p.from && `–${String(p.to).padStart(2, '0')}`}
                </span>
                <div className="pack__name">{p.name}</div>
                <div className="pack__gist" dangerouslySetInnerHTML={{ __html: p.gist }} />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <button type="button" className="btn btn--ghost" onClick={() => setDeep(!deep)} aria-expanded={deep}>
            <ChevronDown aria-hidden style={{ transform: deep ? 'rotate(180deg)' : undefined }} />
            ما يفترضه فيك، وما لا يشرحه
          </button>
          {deep && (
            <div className="stack" style={{ marginBlockStart: '1rem' }}>
              <p className="prose-wrap" style={{ color: 'var(--ink-2)' }}>
                يفترض <span className="en">Python</span> بمستوى العمل، و
                <span className="en">C</span> مرساةً للمقارنات. ولا يفترض خبرةً
                بالمترجمات ولا بنظريّة اللغات.
              </p>
              <p className="prose-wrap" style={{ color: 'var(--ink-2)' }}>
                ولا يشرح التصيير — كيف تصير البنيةُ صورة — ويقف عند{' '}
                <span className="en">SVG</span> نصّاً يُكتَب. وكلُّ ما يُبنى فيه
                بالمكتبة القياسية وحدها، بلا تبعيةٍ واحدة.
              </p>
              <ol className="prose-wrap" style={{ paddingInlineStart: '1.4rem' }}>
                {regions.map((r) => (
                  <li key={r.num} style={{ listStyle: 'decimal' }}>
                    <Link to={`/r/${r.num}/0`}>
                      <span className="num">{r.num}</span>{' '}
                      <span dangerouslySetInnerHTML={{ __html: r.shortHtml }} />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        <footer className="foot">
          مبنيٌّ ليُدرَس وحده. والتقدّم محفوظٌ في متصفّحك، بلا حسابٍ وبلا إرسال.
        </footer>
      </main>
    </>
  );
}
