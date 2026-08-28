/**
 * المدخل — صفحةُ هبوطٍ لا فهرسُ روابط.
 *
 * وترتيبها ليس ذوقاً: علامةٌ ومقياسٌ كبير، ثم *ما هذا* بلا مصطلح، ثم **لحظةُ
 * تفاعلٍ واحدة** تقلب الادّعاء الذي يقوم عليه المنهج (أربعةُ أرقامٍ مقيسة)،
 * ثم بديهياته الخمس معروضةً، ثم الطريق مجمَّعاً بالحزم، ثم العمق مطويّاً.
 *
 * ولا جدارَ كودٍ في وجه الداخل: البلوك الوحيد خلف `details` يفتحه من أراد.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ladder } from '../components/Ladder';
import { TopBar } from '../components/TopBar';
import { axioms, ladder } from '../content/facts';
import { forWhom, packs } from '../content/readme';
import { regions } from '../content/regions';
import { store } from '../lib/store';

export function Home() {
  const [reveal, setReveal] = useState(false);
  const last = store.lastRegion();

  return (
    <>
      <TopBar />
      <main className="wrap" id="main">
        <section className="hero">
          <img className="hero__logo" src="./python-logo.svg" alt="Python" />
          <h1>الاسم والكائن والمصفوفة والحدّ</h1>
          <p className="hero__sub" dangerouslySetInnerHTML={{ __html: forWhom }} />
        </section>

        <section className="section">
          <div className="section__h">
            <h2>مليون عددٍ، أربع طرق</h2>
            <span className="section__note">النسبة هي الثابت — والزمن تقيسه أنت</span>
          </div>
          <p className="prose-wrap">
            العملية واحدة: جمعُ عمودٍ فيه مليون عدد. إحداها حلقةٌ تكتبها، وإحداها
            دالّةٌ مدمَجةٌ مكتوبةٌ بـC. رتّبها في رأسك، ثم اكشف.
          </p>
          <div style={{ maxWidth: '34rem', marginBlock: '1rem' }}>
            <Ladder rungs={ladder} reveal={reveal} />
          </div>
          <button type="button" className="btn btn--go" onClick={() => setReveal(!reveal)}>
            {reveal ? 'اطوِ الأرقام' : 'اكشف الأرقام'}
          </button>
          {reveal && (
            <p className="prose-wrap" style={{ marginTop: '1rem' }}>
              اثنان يخالفان الحدس: المدمَجةُ مكتوبةٌ بـC ولا تكسب إلا ثلاثة
              أضعاف، والاثنان الأخيران متساويان. والسبب واحدٌ يتكرّر في المنهج
              كلِّه — الكلفة في العبور لا في الحساب.
            </p>
          )}
        </section>

        <section className="section">
          <div className="section__h">
            <h2>خمسُ بديهيات</h2>
            <span className="section__note">يُشتقّ منها كلُّ ما يبدو غريباً</span>
          </div>
          <div className="hero__axioms">
            {axioms.map((a, i) => (
              <div className={`axiom${i === 4 ? ' axiom--on' : ''}`} key={a.ord}>
                <span className="axiom__n">{i + 1}</span>
                <span className="axiom__t" dangerouslySetInnerHTML={{ __html: a.text }} />
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__h">
            <h2>الطريق</h2>
            <span className="section__note">خمسُ حِزَم، والجدولُ يعبرها كلَّها</span>
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
              الإقليم <span className="num">00</span> نظريٌّ وحده، ثم يُبنى جدولٌ
              عموديٌّ في خمسين سطراً تكتبه بيدك. ويعدّله كلُّ إقليمٍ بعده أو
              يمدّه: يستجيب للبروتوكولات، ثم يُقاس بطؤه، ثم يُستبدَل تخزينه، ثم
              تنتقل حلقتُه إلى C.
            </p>
            <p>
              ولا حلول في المنهج، ولكلّ لغزٍ مَخرجٌ تفتحه بيدك. وكلُّ لوحةِ زمنٍ
              من جهازٍ واحد — والثابت هو النسبة. و<span className="en">async</span>{' '}
              وحلقةُ الأحداث ليست هنا؛ يقف المنهج عند حدّ القفل في الإقليم{' '}
              <span className="num">15</span>.
            </p>
          </details>
        </section>

        <footer className="foot wrap">
          مصدرُ كلّ ما تقرؤه ماركداونُ المنهج، والموقع يُصرِّفه ولا ينسخه.
        </footer>
      </main>
    </>
  );
}
