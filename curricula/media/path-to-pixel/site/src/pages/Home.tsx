/**
 * المدخل — صفحةُ هبوطٍ لا فهرسُ روابط.
 *
 * وترتيبها ليس ذوقاً: علامةٌ ومقياسٌ كبير، ثم *ما هذا* بلا مصطلح، ثم **لحظةُ
 * تفاعلٍ واحدة** تقلب الادّعاء الذي يقوم عليه الموضوع كلُّه، ثم سلّمُ التشخيص
 * (`0 → 6 → 105`)، ثم البديهيات الخمس، ثم الطريق مجمَّعاً، ثم العمق مطويّاً.
 *
 * ولا جدارَ كودٍ في وجه الداخل، ولا مصطلحَ مبهمٍ في أوّل شاشتين.
 */
import { Link } from 'react-router-dom';
import { EdgeStrip } from '../components/Edge';
import { Mark } from '../components/Mark';
import { TopBar } from '../components/TopBar';
import { axioms, ladder } from '../content/facts';
import { forWhom, packs } from '../content/readme';
import { regions } from '../content/regions';
import { store } from '../lib/store';

export function Home() {
  const last = store.lastRegion();

  return (
    <>
      <TopBar />
      <main className="wrap" id="main">
        <section className="hero">
          <Mark className="mark mark--hero" />
          <h1>من المسار إلى البكسل</h1>
          <p className="hero__sub">
            تكتب: دائرةٌ نصفُ قطرها مئة. وتعرض الشاشةُ صفوفاً من خلايا، لكلِّ
            خليّةٍ رقمٌ واحد. <b>ما الذي جرى بين الاثنين؟</b>
          </p>
          <p className="hero__sub" dangerouslySetInnerHTML={{ __html: forWhom }} />
        </section>

        <section className="section">
          <div className="section__h">
            <h2>حرّك الحافّة</h2>
            <span className="section__note">الرماديُّ نصيبُ الخليّة من المساحة</span>
          </div>
          <p className="prose-wrap">
            ثمانِ خلايا وحافّةٌ تعبرها. الخليّةُ التي تقع الحافّةُ في وسطها ليست
            مضاءةً ولا مطفأة — لها <b>نصيب</b>، ورقمُها هو ذلك النصيب.
          </p>
          <EdgeStrip />
          <p className="prose-wrap" style={{ marginTop: '1rem' }}>
            ومجموعُ الأرقام يساوي المسافة التي قطعتها الحافّة بالضبط. هذا هو
            كلُّ ما يعنيه «التنعيم» — <b>مساحةٌ تُحسَب، لا ضبابةٌ تُضاف</b>.
          </p>
        </section>

        <section className="section">
          <div className="section__h">
            <h2>ثلاثُ صورٍ ضدّ مصيّرٍ ناضج</h2>
            <span className="section__note">من ٦٥٥٣٦ بكسلاً — والسلطةُ تفسّر الفرق</span>
          </div>
          <p className="prose-wrap">
            نفسُ القاعدة، ونفسُ موضع العيّنة، وثلاثةُ أشكال. الأوّل يطابق
            المصيّر الذي يرسم أكثر الشاشات <b>بايتاً ببايت</b>، والباقيان لا —
            ولا واحدٌ منهما مخطئ.
          </p>
          <div className="diag" style={{ maxWidth: '32rem', marginTop: '1rem' }}>
            {ladder.map((r) => (
              <div className={`diag__row diag--${r.authority}`} key={r.shape}>
                <span className="diag__name">
                  <span dangerouslySetInnerHTML={{ __html: r.shape }} />
                  <span className="diag__auth">@{r.authority}</span>
                </span>
                <span className="diag__n">{r.off} / {r.total}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__h">
            <h2>خمسُ بديهيات</h2>
            <span className="section__note">يُشتقّ منها كلُّ ما يبدو قاعدةً اعتباطية</span>
          </div>
          <div className="hero__axioms">
            {axioms.map((a, i) => (
              <div className="axiom" key={a.ord}>
                <span className="axiom__n">{i + 1}</span>
                <span className="axiom__t" dangerouslySetInnerHTML={{ __html: a.text }} />
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__h">
            <h2>الطريق</h2>
            <span className="section__note">خمسُ حِزَم، ودالّةُ ملءٍ واحدةٍ تعبرها</span>
          </div>
          <div className="grid-packs">
            {packs.map((p) => (
              <div className="pack" key={`${p.from}-${p.to}`}>
                {p.name && <div className="pack__name" dangerouslySetInnerHTML={{ __html: p.name }} />}
                <div className="pack__span">
                  {p.from === p.to ? String(p.from).padStart(2, '0')
                    : `${String(p.from).padStart(2, '0')}–${String(p.to).padStart(2, '0')}`}
                </div>
                <div className="pack__gist" dangerouslySetInnerHTML={{ __html: p.gist }} />
                <div className="pack__list">
                  {regions
                    .filter((r) => r.n >= p.from && r.n <= p.to)
                    .map((r) => (
                      <Link
                        className={`pack__item${store.seenIn(r.num) ? ' pack__item--seen' : ''}`}
                        to={`/r/${r.num}/0`}
                        key={r.num}
                      >
                        <span className="pack__no">{r.num}</span>
                        <span dangerouslySetInnerHTML={{ __html: r.shortHtml }} />
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {last && (
          <section className="section">
            <div className="section__h"><h2>حيث توقّفتَ</h2></div>
            <Link className="btn btn--go" to={`/r/${last}/${store.lastShot(last)}`}>
              الإقليم {last} — اللقطة <span className="num">{store.lastShot(last) + 1}</span>
            </Link>
          </section>
        )}

        <section className="section">
          <details className="details">
            <summary>كيف يُدرَس، وما لا يُشرَح فيه</summary>
            <p>
              الإقليم <span className="num">00</span> نظريٌّ وحده، ثمّ تُكتَب
              دالّةُ ملءٍ في عشرين سطراً تعمل من أوّل يوم: صحيحةٌ، بطيئة،
              مسنَّنة، وتكسر عند أوّل مسارٍ يقطع نفسه. وعيوبُها الأربعةُ هي
              جدولُ الطريق.
            </p>
            <p>
              والكودُ كلُّه <span className="en">C</span>، وكلُّ صورةٍ تُقاس
              ضدّ <span className="en">Skia</span> ويُنسَخ الفرقُ رقماً — فـ«تبدو
              صحيحة» ليست ادّعاءً يُفحَص. ولا حلولَ في المنهج.
            </p>
            <p>
              وصيغُ الصور وبنيةُ الخطوط والبعدُ الثالث ليست هنا: هذا المنهج
              يتلقّى مساراتٍ ويُخرِج بكسلات، والحدُّ معلَنٌ في الإقليم{' '}
              <span className="num">26</span>.
            </p>
          </details>
        </section>

        <footer className="foot wrap">
          مصدرُ كلّ ما تقرؤه ماركداونُ المنهج وملفّاتُ أشكاله، والموقع يُصرِّفه
          ولا ينسخه.
        </footer>
      </main>
    </>
  );
}
