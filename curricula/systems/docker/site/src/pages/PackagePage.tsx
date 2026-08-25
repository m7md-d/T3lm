/** حزمةٌ واحدة: سطرُها من `box` مُبرَزاً، وأقاليمها تحته. */
import { Navigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { BoxMap } from '../components/BoxMap';
import { RegionRail } from '../components/RegionRail';
import { packages } from '../content/packages';
import { regions } from '../content/regions';
import { inline } from '../lib/md';

export function PackagePage() {
  const { id = '' } = useParams();
  const pkg = packages.find((p) => p.id === id);
  if (!pkg) return <Navigate to="/" replace />;

  const items = regions
    .filter((r) => r.no >= pkg.range[0] && r.no <= pkg.range[1])
    .map((r) => ({ no: r.no, slug: r.slug, title: r.title.replace(/^الإقليم\s+\S+\s+—\s+/, '') }));

  return (
    <>
      <TopBar where={pkg.name} />
      <main className="main" id="main">
        <header className="section-head">
          <span className="pkgcard__range num en">{pkg.range[0]}–{pkg.range[1]}</span>
          <h1>{pkg.name}</h1>
        </header>
        <p className="measure" dangerouslySetInnerHTML={{ __html: inline(pkg.takes) }} />
        <p className="pkgcard__line measure" style={{ marginTop: 'var(--dk-gap)' }}>
          <span className="pkgcard__line-label">تفكّك من </span>
          <code>box</code>
          <span className="pkgcard__line-label">: </span>
          <span dangerouslySetInnerHTML={{ __html: inline(pkg.line) }} />
        </p>

        <div style={{ marginTop: 'var(--dk-gap-lg)' }}>
          <BoxMap hit={pkg.lines ?? []} />
        </div>

        <header className="section-head"><h2>أقاليمها</h2></header>
        <RegionRail items={items} />
      </main>
    </>
  );
}
