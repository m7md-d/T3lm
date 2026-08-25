/**
 * الواجهة الرئيسية — **أوّل برهانٍ على أن هذا المنهج ليس كغيره**، لا فهرس روابط.
 *
 * ومادّتها ثلاثة أشياء موجودةٌ في المصدر:
 *   ١) الفرضية تُفكَّك بيد القارئ: «كونتينر» ⇐ أربعة حقولٍ منفصلة (٠٠ · ٣٣).
 *   ٢) `box.c` خريطةً، والحزم الثمان فوقه (جدول `../../README.md`).
 *   ٣) البديهيات الخمس بعمود «أوّل ما يتساقط منها».
 *
 * والحركة الوحيدة هنا يقودها القارئ خطوةً واحدة، وتحت `prefers-reduced-motion`
 * تبقى حالتين ساكنتين بمفتاح.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Unlink } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { BoxMap, BOX_LINE_COUNT } from '../components/BoxMap';
import { PackageCard } from '../components/PackageCard';
import { ProcessCard, FIELDS } from '../components/ProcessCard';
import { AxiomList } from '../components/AxiomList';
import { packages, axioms } from '../content/packages';
import { regions } from '../content/regions';
import { store } from '../lib/store';
import meta from '../../../curriculum.json';

export function Home() {
  const [torn, setTorn] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const last = store.lastRegion();

  const lit = open ?? hover;
  const hit = lit ? packages.find((p) => p.id === lit)?.lines ?? [] : [];

  return (
    <>
      <TopBar />
      <main className="main" id="main">
        <section className="hero">
          <h1 className="hero__word" data-torn={torn}>كونتينر</h1>
          <p className="hero__sub">
            {torn
              ? 'أربع خصائصَ على عملية، كلٌّ منها بدائيةٌ قائمةٌ بذاتها في النواة.'
              : 'كلمةٌ واحدة، وتحتها لا شيء واحد.'}
          </p>
          <p className="hero__tagline">{meta.tagline}</p>
          <button type="button" className="hero__tear" onClick={() => setTorn((v) => !v)}>
            <Unlink aria-hidden />
            <span>{torn ? 'أعِدها كلمةً' : 'فكّكها'}</span>
          </button>
          <div style={{ marginTop: 'var(--dk-gap-lg)' }}>
            <ProcessCard on={torn ? [...FIELDS] : []} />
          </div>
        </section>

        <header className="section-head">
          <h2>الطريق</h2>
          <span className="section-head__kicker num">{BOX_LINE_COUNT} سطراً · ثمانِ حِزَم</span>
        </header>
        <p className="measure" style={{ color: 'var(--dk-muted)' }}>
          الإقليم الأوّل يبني عازلاً كاملاً، وكلُّ حزمةٍ بعده تفكّك سطراً منه.
        </p>

        <div className="stack-lg" style={{ marginTop: 'var(--dk-gap-lg)' }}>
          <BoxMap hit={hit} />
          <div className="pkggrid">
            {packages.map((p) => (
              <PackageCard
                key={p.id}
                pkg={p}
                to={`/p/${p.id}`}
                open={open === p.id}
                onToggle={() => setOpen(open === p.id ? null : p.id)}
                onHover={setHover}
                regions={regions
                  .filter((r) => r.no >= p.range[0] && r.no <= p.range[1])
                  .map((r) => ({ no: r.no, slug: r.slug, title: r.title.replace(/^الإقليم\s+\S+\s+—\s+/, '') }))}
              />
            ))}
          </div>
        </div>

        <header className="section-head">
          <h2>البديهيات الخمس</h2>
          <span className="section-head__kicker">وأوّل ما يتساقط منها</span>
        </header>
        <AxiomList items={axioms} />

        {last ? (
          <p style={{ marginTop: 'var(--dk-gap-xl)' }}>
            <Link to={`/r/${last}`}>عُد إلى حيث وقفت — الإقليم <span className="num">{last}</span></Link>
          </p>
        ) : null}
      </main>
    </>
  );
}
