import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { regions, bands, TOOLCHAIN } from '../lib/content';
import { examples } from '../lib/examples';
import { heroProof } from '../lib/hero';
import { Proof } from '../components/Proof';
import { Worked } from '../components/Worked';
import { store } from '../lib/store';
import { inline } from '../lib/inline';

const Runner = lazy(() => import('@t3lm/kit/editor').then((m) => ({ default: m.Runner })));

const proof = heroProof();
const first = examples[0];
const rest = examples.slice(1);

/**
 * ما يخرج به القارئ. مأخوذٌ من `README` §«لمن كُتب» و§«الطريق»، ومن الإقليم ٢٨.
 * ثلاثةٌ لأن الصفّ الواحد يُقرأ دفعةً، والأربعة تُقرأ قائمةً.
 */
const OWN = [
  {
    n: '01',
    h: 'أن تقرأ برنامجاً وتعرف ما سيفعله',
    p: 'قبل أن تشغّله. تتبّعُ الكود سطراً سطراً هو ما يفرّق بين من يكتب ومن ينسخ.',
  },
  {
    n: '02',
    h: 'أن تعرف أين تسكن كل قيمة',
    p: 'كم بايتاً تشغل، ومن يملكها، ومتى تموت. هذا ما لا تعطيك إيّاه لغةٌ تخفيه عنك.',
  },
  {
    n: '03',
    h: 'أن تبني برنامجاً يُستعمَل',
    p: 'يُختَم المنهج بـshell تعمل: تقرأ أمراً، وتشغّل برنامجاً، وتوصل مخرَجه بمدخل آخر.',
  },
];

export default function Home() {
  const last = store.lastRegion();

  return (
    <div className="home">
      {/* ══ الافتتاح: وعدٌ يميناً، وبرنامجٌ يعمل يساراً ══ */}
      <header className="open">
        <div className="open-say">
          <p className="open-kick en">{TOOLCHAIN}</p>
          <h1>تعلَّم البرمجة <em>من الآلة صعوداً</em></h1>
          <p className="open-lead">
            لا تبدأ من إطارٍ يخفي عنك ما يجري. تبدأ من البايت، فترى بعينك كيف
            يُخزَّن كل شيء ومن يقرّر ذلك — <b>ثم تكتب</b>.
          </p>
          <p className="open-need">
            مكتوبٌ لمن لم يكتب سطراً قبل اليوم. تسعةٌ وعشرون إقليماً،
            و<b className="en">189</b> برنامجاً شُغِّل ونُقل مخرَجُه كما هو.
          </p>
          <Link className="go" to={`/r/${last ?? regions[0]?.num ?? '00'}`}>
            {last ? 'واصِل من حيث وقفت' : 'ابدأ من الفصل صفر'} ←
          </Link>
        </div>

        {first && (
          <div className="open-run">
            <Suspense fallback={<pre className="fig en">{first.code}</pre>}>
              <Runner initial={first.code} lang="c" mode="view" filename="main.c" useTabs tabSize={4} minHeight="0" />
            </Suspense>
            <div className="open-out" data-family="spec">
              <span>المخرَج</span>
              <pre className="en">{first.out}</pre>
            </div>
            <p className="open-cap">
              أوّل برنامجٍ في المنهج. سطرٌ يطلب من النظام أن يطبع، وسطرٌ يقول
              «انتهيتُ بخير».
            </p>
          </div>
        )}
      </header>

      {/* ══ ما تخرج به — ثلاثة أعمدة ══ */}
      <section className="band">
        <h2 className="band-h">ما تخرج به</h2>
        <div className="own">
          {OWN.map((o) => (
            <article key={o.n}>
              <span className="own-n en">{o.n}</span>
              <h3>{o.h}</h3>
              <p>{o.p}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ══ أمثلة محلولة — شبكة ══ */}
      {rest.length > 0 && (
        <section className="band">
          <h2 className="band-h">وهذا ما ستقرؤه بعد قليل</h2>
          <p className="band-say">
            خمسةُ أقاليم من الطريق، كلٌّ بأقصر برنامجٍ فيه ومخرَجِه. اقرأها ولا
            تحاول أن تفهمها الآن — أن تعود إليها فتفهمها هو الطريق نفسه.
          </p>
          <div className="works">
            {rest.map((ex) => <Worked key={ex.num} ex={ex} />)}
          </div>
        </section>
      )}

      {/* ══ البرهان ══ */}
      {proof && (
        <section className="band">
          <h2 className="band-h">والمفاجأة التي يقوم عليها المنهج</h2>
          <p className="band-say">
            برنامجٌ واحد، ونصٌّ واحد حرفاً بحرف. بدّل ما تطلبه من المترجم وانظر
            ماذا يصير الجواب.
          </p>
          <Proof proof={proof} />
        </section>
      )}

      {/* ══ الطريق — ثماني حِزَم، كلٌّ صفٌّ عرضيّ: عنوانها يميناً وأقاليمها يساراً ══ */}
      <section className="band">
        <h2 className="band-h">الطريق</h2>
        <p className="band-say">
          تسعةٌ وعشرون إقليماً في ثماني حِزَم. وحدودُها من المنهج نفسه: كل حزمةٍ
          تجيب سؤالاً واحداً، وتفتح التي بعدها.
        </p>
        <div className="road">
          {bands.map((b) => (
            <section className="road-band" key={b.from}>
              <header className="road-of">
                <span className="road-span en">{b.from}–{b.to}</span>
                <h3>{b.name}</h3>
                <p>{inline(b.say)}</p>
              </header>
              <ol className="road-cards">
                {b.regions.map((r) => (
                  <li key={r.num} className={last === r.num ? 'road-here' : undefined}>
                    <Link to={`/r/${r.num}`}>
                      <span className="road-num en">{r.num}</span>
                      <span className="road-title">{inline(r.title)}</span>
                      <span className="road-hook">{r.hook}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
