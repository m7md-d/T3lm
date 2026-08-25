/**
 * الأثر — ما هُدم من اعتقاداتك، وما توقّعتَه قبل أن تُفتَح اللوحة.
 * **كل ما يُخزَّن يُعرَض**: حقلٌ يُحفَظ ولا يُعرَض وعدٌ لم يُنفَّذ.
 */
import { TopBar } from '../components/TopBar';
import { Trace } from '../components/Trace';
import { regions } from '../content/regions';
import { store } from '../lib/store';

export function TracePage() {
  const rows = regions
    .filter((r) => store.seenIn(r.no) > 0)
    .flatMap((r) => (r.summary?.rows ?? []).map((row) => ({ from: r.no, what: row.learned })));

  return (
    <>
      <TopBar where="الأثر" />
      <main className="main" id="main">
        <header className="section-head"><h1>الأثر</h1></header>
        <p className="measure" style={{ color: 'var(--dk-muted)' }}>
          يعدّ من حيث بدأتَ. بلا نقاطٍ وبلا نسبةٍ وبلا سلسلة.
        </p>
        <div style={{ marginTop: 'var(--dk-gap-lg)' }}>
          <Trace rows={rows} />
        </div>
      </main>
    </>
  );
}
