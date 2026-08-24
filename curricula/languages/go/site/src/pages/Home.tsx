import { useState } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import { ChevronDown, ArrowLeft, Check } from 'lucide-react';
import { regions, sealed, intro, AXIOMS } from '../lib/content';
import { inline as withCode } from '../lib/inline';
import Gap from '../components/Gap';
import { store } from '../lib/store';
import ByteRuler from '../components/ByteRuler';
import LayoutLab from '../components/LayoutLab';

/** `x` في نصّ البديهية المستخرَج ← وسمُ كود بخطٍّ أحاديّ ووسم `.en`. */

export default function Home() {
  const last = store.lastRegion();
  const done = store.countPredictions();

  return (
    <div className="home">
      <header className="hero">
        <ByteRuler words={8} label="offset" />
        <span className="kicker en">go1.26.6 · darwin/arm64</span>
        <h1>Go — <em>من الجذور</em></h1>
        <p>
          منهجٌ عن بنية Go: نظام أنواعها، وتمثيلها في الذاكرة، وضماناتها.
          والسؤال الذي يتكرّر في كل فصل:
          <b> ما الذي يضمن أن هذا الكود يشتغل، وأين ينتهي ذلك الضمان؟</b>
        </p>
        {/* شرطٌ لا وعد: من README §«لمن كُتب». يجيب عن سؤال الباب — هل هذا لي؟ */}
        <p className="hero-need">
          يفترض <b>C</b> جيّداً و<b>Go</b> لمساً سطحياً. ولا يفترض كوداً كتبتَه من قبل.
        </p>
        <Link className="resume" to={`/r/${last ?? regions[0]?.num ?? '00'}`}>
          {(() => {
            /* اسم الفصل يأتي من عنوانه في الماركداون — المدخل لا يُسمّى إقليماً */
            const r = regions.find((x) => x.num === (last ?? regions[0]?.num));
            if (!r) return 'ابدأ';
            return last ? `واصِل من: ${r.title}` : `ابدأ من ${r.label}: ${r.title}`;
          })()} ←
        </Link>
        {done > 0 && <span className="tally">{done} توقّعاً مثبَّتاً</span>}
      </header>

      <LayoutLab />

      <Axioms />

      <section className="map">
        <h2>الطريق</h2>
        <div className="grid">
          {regions.map((r) => {
            /* ما مضى يُعَدّ، وما بقي لا يُعرَض — نفس قاعدة «الأثر» في الفصل */
            const seen = store.seenIn(r.num);
            return (
              <Link key={r.num} className="card" to={`/r/${r.num}`}>
                <i className="en">{r.num}</i>
                <b>{r.title}</b>
                <span className="card-hook">{withCode(r.hook)}</span>
                {seen > 0 && (
                  <em className="card-seen">
                    <Check size={11} aria-hidden="true" />
                    <span className="num">{seen}</span> لقطة
                  </em>
                )}
              </Link>
            );
          })}
          {sealed.map((s) => (
            <div key={s.num} className="card lock">
              <i className="en">{s.num}</i>
              <b>مختوم</b>
              <span>{s.teaser}</span>
            </div>
          ))}
        </div>
      </section>

      <Gap />

      {intro.sections.length > 0 && (
        <section className="intro">
          {intro.sections
            .filter((s) => /كيف تُدرَس|الإصدار المستهدف|لمن كُتب/.test(s.title))
            .map((s) => (
              <details key={s.id}>
                <summary>{s.title}</summary>
                <div className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(s.raw) as string }} />
              </details>
            ))}
        </section>
      )}
    </div>
  );
}

/**
 * البديهيات الخمس — بطاقاتٌ تُفتح.
 *
 * كانت قائمةً تتفاعل مع المؤشّر ولا تُنقَر: وعدُ تفاعلٍ بلا تفاعل. والمادّة
 * موجودةٌ فعلاً — لكلّ بديهيةٍ شرحُها، وما رُفض لحمايتها بثمنه، والفصول التي
 * تستعملها باسمها — فصارت البطاقة تفتحها بدل أن تلمّح إليها.
 *
 * وواحدةٌ مفتوحةٌ في كل مرّة: خمس بطاقاتٍ مفتوحةً معاً تُعيد الحائط الذي فُتحت
 * لتجنّبه.
 */
function Axioms() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="axioms-home">
      <h2>البديهيات الخمس</h2>
      <p className="sub">
        كل ما سيبدو غريباً في Go يعود إلى خمسة قرارات. كلٌّ منها ادّعاءٌ
        تفحصه بنفسك. <b>افتح واحدة.</b>
      </p>

      <ol>
        {AXIOMS.map((a) => {
          const on = open === a.n;
          return (
            <li key={a.n} data-on={on || undefined}>
              <button
                type="button"
                className="ax-face"
                aria-expanded={on}
                aria-controls={`ax-${a.n}`}
                onClick={() => setOpen(on ? null : a.n)}
              >
                <i className="en">{a.n}</i>
                <span className="ax-head">
                  <b>{a.short}</b>
                  <span className="ax-falls">
                    {a.falls.map((f, i) => <em key={i}>{withCode(f)}</em>)}
                  </span>
                </span>
                <ChevronDown className="ax-chev" size={17} aria-hidden="true" />
              </button>

              {on && (
                <div className="ax-body" id={`ax-${a.n}`}>
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: marked.parse(a.body) as string }}
                  />

                  {a.rejects.length > 0 && (
                    <div className="ax-rejects">
                      <h4>ما رُفض لحمايتها — والثمن الذي تدفعه</h4>
                      <ul>
                        {a.rejects.map((r) => (
                          <li key={r.what}>
                            <b>{withCode(r.what)}</b>
                            <span>{withCode(r.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="ax-go">
                    <Link to={`/r/00?s=${a.shot}`}>
                      اقرأها في موضعها، ومعها الكود <ArrowLeft size={14} />
                    </Link>
                    {a.seen.length > 0 && (
                      <p className="ax-seen">
                        وتعود باسمها في:{' '}
                        {a.seen.map((g, i) => (
                          <span key={g.num}>
                            {i > 0 && '، '}
                            <Link to={`/r/${g.num}`}>{g.title}</Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
