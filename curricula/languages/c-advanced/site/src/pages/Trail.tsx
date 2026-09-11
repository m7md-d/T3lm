/**
 * الأثر — يعدّ **من حيث بدأتَ**، لا نحو نهايةٍ لم تُبلَغ.
 * ولا نقاط ولا شارات ولا سلاسل ولا نسب (أدلّة §٧).
 *
 * ومادّته «فرق الإتقان»: توقّعُك الأوّل بجانب ما خرج فعلاً (أدلّة §٧).
 */
import { Link } from 'react-router-dom';
import { OutputBlock } from '../components/OutputBlock';
import { SourceTag } from '../components/SourceTag';
import { Title } from '../components/Title';
import { TopBar } from '../components/TopBar';
import { chapters } from '../content/regions';
import { store } from '../lib/store';

const panelById = new Map(
  chapters.flatMap((c) => c.panels.map((p) => [p.id, { c, p }] as const)),
);

export function TrailPage() {
  const crossed = chapters
    .map((c) => ({ c, shots: c.shots.filter((_, i) => store.seen(c.num, i)) }))
    .filter((x) => x.shots.length > 0);

  const kept = [...panelById.entries()]
    .map(([id, v]) => ({ ...v, said: store.prediction(id) }))
    .filter((x): x is typeof x & { said: string } => !!x.said);

  return (
    <>
      <TopBar where="الأثر" />
      <main id="main" className="doc">
        <h1 className="doc-h">الأثر</h1>

        <h2 className="h2">ما توقّعتَه، وما خرج</h2>
        {kept.length === 0 ? (
          <p className="lede">
            لم تُقفَل بعدُ لوحةٌ خلف توقّع. وأوّلها في <Link to="/f/00">الفصل ٠٠</Link>.
          </p>
        ) : (
          kept.map(({ c, p, said }) => (
            <section key={p.id} className="diff">
              <header className="diff-head">
                <Link className="diff-ch en" to={`/f/${c.num}`}>{c.num}</Link>
                {p.tag && p.family ? <SourceTag tag={p.tag} family={p.family} /> : null}
              </header>
              <div className="diff-said">
                <span className="diff-label">توقّعتَ</span>
                <p className="diff-text">{said}</p>
              </div>
              <div className="diff-was">
                <span className="diff-label">وخرج</span>
                <OutputBlock text={p.output} />
              </div>
            </section>
          ))
        )}

        <h2 className="h2">ما عبرتَه</h2>
        {crossed.length === 0 ? (
          <p className="lede">لا شيء بعد. <Link to="/f/00">ابدأ من الفصل ٠٠ ←</Link></p>
        ) : (
          <ul className="crossed">
            {crossed.map(({ c, shots }) => (
              <li key={c.num} className="crossed-ch">
                <Link className="crossed-n en" to={`/f/${c.num}`}>{c.num}</Link>
                <ul className="crossed-list">
                  {shots.map((s) => (
                    <li key={s.id}>
                      <Link to={`/f/${c.num}/${c.shots.indexOf(s)}`}>
                        <Title md={s.titleMd} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
