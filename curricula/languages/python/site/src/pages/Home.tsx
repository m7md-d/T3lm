/**
 * المدخل — صفحةُ هبوطٍ لا فهرسُ روابط.
 *
 * وترتيبها: علامةٌ ومقياسٌ كبير، ثم *ما هذا* بلا مصطلح، ثم **لحظةُ تفاعلٍ واحدة**
 * تقلب الادّعاء الذي يفتح المنهج (كم يزن ألفُ عدد؟)، ثم قرارات اللغة الأربعة،
 * ثم الطريق مجمَّعاً بالحزم، ثم ما لا يُشرَح فيه مطويّاً.
 *
 * ولا جدارَ كودٍ في وجه الداخل: لا بلوك في الصفحة أصلاً.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sizes } from '../components/Sizes';
import { TopBar } from '../components/TopBar';
import { decisions, sizes } from '../content/facts';
import { forWhom, packs } from '../content/readme';
import { regions } from '../content/regions';
import { store } from '../lib/store';

export function Home() {
  const [reveal, setReveal] = useState(false);
  const last = store.lastRegion();

  return (
    <>
      <TopBar />
      <main className="wrap home" id="main">
        <section className="hero">
          <img className="hero__logo" src="./python-logo.svg" alt="Python" />
          <h1>الاسم والكائن والمفسّر</h1>
          <p className="hero__sub" dangerouslySetInnerHTML={{ __html: forWhom }} />
        </section>

        <section className="section">
          <div className="section__h">
            <h2>كم يزن ألفُ عدد؟</h2>
            <span className="section__note">الأرقام من الفصل 02، مقيسةً بـsys.getsizeof</span>
          </div>
          <p className="prose-wrap">
            في C تشغل ألفُ قيمةٍ من نوع <span className="en">long</span> ثمانية
            آلاف بايت. خمّن الثلاثة قبل أن تكشف: العدد الواحد، والقائمة، ومصفوفةٌ
            من الوحدة <span className="en">array</span>.
          </p>
          <div style={{ maxWidth: '34rem', marginBlock: '1rem' }}>
            <Sizes rows={sizes} reveal={reveal} />
          </div>
          <button type="button" className="btn btn--go" onClick={() => setReveal(!reveal)}>
            {reveal ? 'اطوِ الأرقام' : 'اكشف الأرقام'}
          </button>
          {reveal && (
            <p className="prose-wrap" style={{ marginTop: '1rem' }}>
              القائمة تشغل ما تشغله المصفوفة تقريباً، ثم تحمل الأعداد خارجها —
              فهي مصفوفةُ إشاراتٍ لا مصفوفةُ أعداد. هذا الفرق هو سبب وجود
              الحزمة الرابعة كلِّها.
            </p>
          )}
        </section>

        <section className="section">
          <div className="section__h">
            <h2>قرارات اللغة</h2>
            <span className="section__note">يُشتقّ منها ما يبدو غريباً بعدها</span>
          </div>
          <div className="hero__axioms">
            {decisions.map((d, i) => (
              <div className="axiom" key={i}>
                <span className="axiom__n">{i + 1}</span>
                <span className="axiom__t" dangerouslySetInnerHTML={{ __html: d }} />
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
                <div className="pack__list">
                  {Array.from({ length: p.to - p.from + 1 }, (_, k) => p.from + k).map((n) => {
                    const num = String(n).padStart(2, '0');
                    const r = regions.find((x) => x.n === n);
                    if (!r) {
                      const name = p.titles[n - p.from];
                      return (
                        <span className="pack__item pack__item--soon" key={num}>
                          <span className="pack__no">{num}</span>
                          <span dangerouslySetInnerHTML={{ __html: name ?? '' }} />
                        </span>
                      );
                    }
                    return (
                      <Link
                        className={`pack__item${store.seenIn(r.num) ? ' pack__item--seen' : ''}`}
                        to={`/r/${r.num}/0`}
                        key={r.num}
                      >
                        <span className="pack__no">{r.num}</span>
                        <span dangerouslySetInnerHTML={{ __html: r.shortHtml }} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {last && (
          <section className="section">
            <div className="section__h"><h2>حيث توقّفتَ</h2></div>
            <Link className="btn btn--go" to={`/r/${last}/${store.lastShot(last)}`}>
              الفصل {last} — القسم <span className="num">{store.lastShot(last) + 1}</span>
            </Link>
          </section>
        )}

        <section className="section">
          <details className="details">
            <summary>كيف يُدرَس، وما لا يُشرَح فيه</summary>
            <p>
              الفصل <span className="num">00</span> يعطي المفردات في أقلّ من ألف
              كلمة، ثم يبني الفصل <span className="num">01</span> جدولاً بأعمدة
              في ستّةٍ وعشرين سطراً. ويعدّله كلُّ فصلٍ بعده أو يمدّه: يُصلَح
              اشتقاقُه، ثم يستجيب للبروتوكولات، ثم يُستبدَل تخزينه، ثم تنتقل
              حلقتُه إلى <span className="en">C</span>.
            </p>
            <p>
              ولا حلول في المنهج، ولكلّ تمرينٍ معايير قبولٍ تفحصها بنفسك. وكلُّ
              مخرَجِ زمنٍ من جهازٍ واحد — والثابت هو النسبة.{' '}
              <span className="en">async</span> وحلقةُ الأحداث ليست هنا؛ يقف
              المنهج عند حدّ القفل في الفصل <span className="num">16</span>.
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
