/**
 * المدخل — صفحة هبوط، لا فهرس ولا أوّل درس.
 *
 * وترتيبها من `site-design` §٣ب: مشهدٌ ← ما هذا ← لحظةُ تفاعلٍ واحدة ←
 * جوهر المنهج ← الطريق ← العمق آخراً ومطويّاً. **وبلا جدار كودٍ في الشاشة
 * الأولى.**
 */
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { SourceMap } from '../components/SourceMap';
import { Title } from '../components/Title';
import { TopBar } from '../components/TopBar';
import { axioms, packOf, packs, planRows } from '../content/plan';
import { chapterAt, chapters } from '../content/regions';
import { html, inline } from '../lib/md';
import meta from '../../../curriculum.json';

/** أوّل فقرةٍ من مدخل الفصل ٠٠ — تقول ما هذا المنهج بلغة مؤلّفه. */
function opening(): string {
  const lead = chapterAt('00')?.lead ?? [];
  for (const b of lead) if (b.kind === 'prose') return html(b.rawMd.split(/\n\s*\n/)[0] ?? '');
  return '';
}

const byNum = new Map(chapters.map((c) => [c.num, c]));

export function Home() {
  return (
    <>
      <TopBar />
      <main id="main" className="home">
        <section className="hero">
          <p className="hero-kicker">الجزء الثاني — بعد منهج C</p>
          <h1 className="hero-h">{meta.title}</h1>
          <div className="hero-say" dangerouslySetInnerHTML={{ __html: opening() }} />
          <figure className="hero-wrap">
            <Hero />
            <figcaption
              className="hero-cap"
              dangerouslySetInnerHTML={{ __html: inline(axioms[0]?.claim ?? '') }}
            />
          </figure>
        </section>

        <section className="block">
          <h2 className="h2">من يضمن؟</h2>
          <p className="lede">
            كلُّ لوحةٍ في هذا المنهج تحمل الجهة التي تملك تقريرها. اختر جهةً لترى أين تقرّر.
          </p>
          <SourceMap />
          <p className="fine">
            كلُّ مربّعٍ لوحةُ مخرَجٍ في فصلها. <Link to="/sources">الجهات العشر وما يقرّره كلٌّ منها ←</Link>
          </p>
        </section>

        <section className="block">
          <h2 className="h2">خمس بديهيات، ولكلٍّ دليلٌ يعمل</h2>
          <ol className="axioms">
            {axioms.map((a) => {
              const p = packs.find((x) => x.axioms.includes(a.n));
              return (
                <li key={a.n} className="axiom">
                  <span className="axiom-n">{a.n}</span>
                  <div className="axiom-body">
                    <p className="axiom-claim" dangerouslySetInnerHTML={{ __html: inline(a.claim) }} />
                    <p className="axiom-falls" dangerouslySetInnerHTML={{ __html: inline(a.falls) }} />
                    {p ? (
                      <Link className="axiom-go" to={`/f/${String(p.from).padStart(2, '0')}`}>
                        {p.title}
                        <span className="axiom-range en">{p.range}</span>
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="block">
          <h2 className="h2">الطريق</h2>
          {packs.map((p) => (
            <div key={p.range} className="pack">
              <header className="pack-head">
                <span className="pack-range en">{p.range}</span>
                <h3 className="pack-h">{p.title}</h3>
                <p className="pack-gist" dangerouslySetInnerHTML={{ __html: inline(p.gist) }} />
              </header>
              <ol className="pack-list">
                {planRows
                  .filter((r) => packOf(r.num)?.range === p.range)
                  .map((r) => {
                    const ch = byNum.get(r.num);
                    return (
                      <li key={r.num} className="row">
                        <Link className="row-a" to={`/f/${r.num}`}>
                          <span className="row-n en">{r.num}</span>
                          {ch ? <Title md={ch.titleMd} className="row-t" /> : <span className="row-t">{r.title}</span>}
                        </Link>
                      </li>
                    );
                  })}
              </ol>
            </div>
          ))}
        </section>

        <section className="block">
          <h2 className="h2">قبل أن تبدأ</h2>
          <div className="cards">
            <Link className="card" to="/lab">
              <h3 className="card-h">المختبر</h3>
              <p className="card-p">صورةٌ واحدة تُبنى بأمر، وكلُّ لوحةٍ هنا خرجت منها. ومعها ما لا يُشغَّل فيها.</p>
            </Link>
            <Link className="card" to="/sources">
              <h3 className="card-h">من يضمن؟</h3>
              <p className="card-p">عشرُ جهاتٍ تقرّر، وتسعةُ وسومٍ تُطوى في أربع. وما بلا وسمٍ تضمنه ISO C.</p>
            </Link>
            <Link className="card" to="/trail">
              <h3 className="card-h">الأثر</h3>
              <p className="card-p">ما عبرتَه، وما توقّعتَه قبل أن تقرأ المخرَج.</p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
