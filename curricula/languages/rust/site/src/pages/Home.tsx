import { useState } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import { ArrowLeft, ChevronDown, Lock, Check } from 'lucide-react';
import { regions, sealed, intro, AXIOMS, TOOLCHAIN } from '../lib/content';
import Gap from '../components/Gap';
import { inline as withCode } from '../lib/inline';
import { store } from '../lib/store';
import BorrowLab from '../components/BorrowLab';

/** `x` في نصٍّ مستخرَج ← وسمُ كود بخطٍّ أحاديّ. */

/**
 * الحُرّاس الخمسة — البديهيات، ووجهُ كل بطاقةٍ **رمزُ الرفض الذي يحرسها**.
 *
 * وهذا هو الحقل الذي يفرّق بينها: لا وسمٌ مكرّر تحت الخمس، بل `E0382` تحت الأولى
 * و`E0499` تحت الثانية — وهو ما سيقابله القارئ فعلاً في مترجمه.
 */
function Guards() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="guards">
      <h2>البديهيات الخمس، وحُرّاسها</h2>
      <p className="sub">
        كل ما سيبدو غريباً في Rust يعود إلى خمسة قرارات. ولكلٍّ منها <b>رمزُ رفضٍ
        يحرسه</b> — هذا ما ستقرأه في طرفيّتك حين تخالفه.
      </p>

      <ol>
        {AXIOMS.map((a) => {
          const on = open === a.n;
          return (
            <li key={a.n} data-on={on || undefined}>
              <button
                type="button"
                className="guard-face"
                aria-expanded={on}
                aria-controls={`ax-${a.n}`}
                onClick={() => setOpen(on ? null : a.n)}
              >
                <i className="en">{a.n}</i>
                <span className="guard-head">
                  <b>{a.short}</b>
                  <span className="guard-falls">
                    {a.falls.map((f, i) => <em key={i}>{withCode(f)}</em>)}
                  </span>
                </span>
                <span className="guard-codes">
                  {a.guards.length > 0
                    ? a.guards.map((g) => <code key={g.code} className="en">{g.code}</code>)
                    : <span className="guard-none">بلا رمزٍ واحد</span>}
                </span>
                <ChevronDown className="guard-chev" size={17} aria-hidden="true" />
              </button>

              {on && (
                <div className="guard-body" id={`ax-${a.n}`}>
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: marked.parse(a.body) as string }}
                  />

                  {a.guards.length > 0 && (
                    <ul className="guard-list">
                      {a.guards.map((g) => (
                        <li key={g.code}>
                          <code className="en">{g.code}</code>
                          <span>{g.gist}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link className="guard-go" to={`/r/00?s=${a.shot}`}>
                    اقرأها في موضعها، ومعها دليلها <ArrowLeft size={14} />
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function Home() {
  const last = store.lastRegion();
  const done = store.countPredictions();
  const start = regions.find((x) => x.num === (last ?? regions[0]?.num));

  return (
    <div className="home">
      <header className="hero">
        <span className="kicker en">{TOOLCHAIN}</span>
        <h1>Rust — <em>ما يثبته المترجم</em></h1>
        <p>
          منهجٌ عن بنية Rust: المِلكية والاستعارة والأعمار ونظام السمات.
          والسؤال الذي يتكرّر في كل فصل:
          <b> ما الذي يمنعه المترجم، وبأي ثمنٍ يمنعه؟</b>
        </p>
        <p className="hero-need">
          يفترض <b>C</b> جيّداً، ولا يفترض سطر Rust واحداً كتبتَه من قبل.
        </p>
        {start && (
          <Link className="resume" to={`/r/${start.num}`}>
            {last ? `واصِل من: ${start.title}` : `ابدأ من ${start.label}: ${start.title}`} ←
          </Link>
        )}
        {done > 0 && <span className="tally">{done} توقّعاً مثبَّتاً</span>}
      </header>

      <BorrowLab />

      <Guards />

      <section className="map">
        <h2>الطريق</h2>
        <div className="grid">
          {regions.map((r) => {
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
              <i className="en" aria-hidden="true"><Lock size={16} /></i>
              <b>{s.title}</b>
              <span className="card-hook">{withCode(s.gist)}</span>
            </div>
          ))}
        </div>
        <p className="map-note">
          المقفلة معلنةٌ في الطريق وتُبنى. والترتيب مقصود: كل فصلٍ يبدأ من بذرةٍ
          خلّفها الذي قبله.
        </p>
      </section>

      <Gap />

      {intro.sections.length > 0 && (
        <section className="intro">
          {intro.sections
            .filter((s) => /كيف تُدرَس|الإصدار المستهدف|لمن كُتب|أدواتك/.test(s.title))
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
