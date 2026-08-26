/**
 * الأثر — **ما عُبِر، محتوًى لا نقاطاً**.
 *
 * ولا شيءَ هنا يعدّ تنازلياً: لا نسبةَ إنجاز، ولا سلسلةَ أيام، ولا شارة.
 * صفوفُ الخلاصات التي بلغها القارئ، وتوقّعاتُه كما كتبها — وكلُّ محفوظٍ يُعرَض.
 */
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Summary } from '../components/Summary';
import { MasteryDiff } from '../components/MasteryDiff';
import { regions } from '../content/regions';
import { store } from '../lib/store';
import { inline } from '../lib/md';

export function TracePage() {
  const walked = regions.filter((r) => store.seenIn(r.no) > 0);

  const diffs = regions.flatMap((r) =>
    r.shots.flatMap((s) =>
      s.blocks.flatMap((b) => {
        if (b.kind !== 'run') return [];
        return b.panels.flatMap((p) => {
          if (!p.gate) return [];
          const predicted = store.prediction(p.gate.id);
          return predicted ? [{ id: p.gate.id, no: r.no, predicted, was: p.output }] : [];
        });
      })
    )
  );

  return (
    <>
      <TopBar where="الأثر" />
      <main className="main home" id="main">
        <h1>الأثر</h1>

        {walked.length ? (
          walked.map((r) => (
            <section className="stack" key={r.no} style={{ marginBlock: 'var(--fl-gap-xl)' }}>
              <header className="section-head">
                <h2>
                  <Link to={`/r/${r.no}`}>
                    <span className="num en">{r.no}</span>{' '}
                    <span dangerouslySetInnerHTML={{ __html: inline(r.name) }} />
                  </Link>
                </h2>
                <span className="section-head__kicker"><span className="num en">{store.seenIn(r.no)}</span> لقطةً عبرتَها</span>
              </header>
              {r.summary.length ? <Summary head={r.summaryHead} rows={r.summary} /> : null}
            </section>
          ))
        ) : (
          <p className="lead-dim">لم تُفتَح لقطةٌ بعد.</p>
        )}

        {diffs.length ? (
          <>
            <header className="section-head">
              <h2>ما توقّعتَه</h2>
              <span className="section-head__kicker num en">{diffs.length}</span>
            </header>
            <div className="stack-lg">
              {diffs.map((d) => <MasteryDiff key={d.id} predicted={d.predicted} was={d.was} />)}
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
