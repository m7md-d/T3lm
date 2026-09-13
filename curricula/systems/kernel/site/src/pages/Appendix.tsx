import { Link, useParams } from 'react-router-dom';
import { bySlug, docs } from '../content/appendix';
import { Blocks } from '../components/Blocks';
import { inline } from '../lib/md';

/** الملاحق: «ثلاثةٌ تُفتَح أثناء العمل ولا تُقرأ متتابعة» — فلا تقطيع بينها. */
export function Appendix() {
  const { slug } = useParams();
  const d = slug ? bySlug[slug] : docs[0];
  if (!d) return <div className="wrap"><p>لا ملحق بهذا الاسم.</p></div>;

  return (
    <div className="wrap narrow">
      <nav className="rail" aria-label="الملاحق">
        {docs.map((x) => (
          <Link
            key={x.slug}
            className="rail-item"
            to={`/appendix/${x.slug}`}
            aria-current={x.slug === d.slug ? 'true' : 'false'}
          >
            {x.title}
          </Link>
        ))}
      </nav>

      <h1 className="ch-title">{d.title}</h1>
      <div className="shot" style={{ maxWidth: 'none' }}>
        <Blocks blocks={d.lead} chapter={`ap-${d.slug}`} />
        {d.sections.map((s) => (
          <section key={s.id}>
            <h2 className="shot-h" id={s.id} dangerouslySetInnerHTML={{ __html: inline(s.title) }} />
            <Blocks blocks={s.blocks} chapter={`ap-${d.slug}`} />
          </section>
        ))}
      </div>
    </div>
  );
}
