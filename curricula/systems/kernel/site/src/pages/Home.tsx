import { Link } from 'react-router-dom';
import { byNum, chapters } from '../content/regions';
import { axioms, envRows, gists, meta, packs, tagRows } from '../content/plan';
import { Measure } from '../components/Measure';
import { Mark } from '../components/TopBar';
import { Prose } from '../components/Prose';
import { store } from '../lib/store';
import { inline } from '../lib/md';
import { byId } from '../content/stages';
import type { Panel, Prose as P } from '../lib/types';

/** أوّل فقرةٍ في الفصل `00` — بلا مصطلحٍ واحدٍ من مصطلحات النواة. */
const opening = (): string => {
  const c = byNum['00'];
  const b = c?.lead.find((x): x is P => x.kind === 'prose');
  return b?.html ?? '';
};

/** لوحةُ القياس الأولى، والفقرةُ التي تفسّر عمودها بعدها مباشرة. */
const measure = (): { panel: Panel | null; say: string | null } => {
  const bl = byNum['00']?.shots[0]?.blocks ?? [];
  const i = bl.findIndex((b) => b.kind === 'panel');
  if (i < 0) return { panel: null, say: null };
  const next = bl[i + 1];
  return { panel: bl[i] as Panel, say: next && next.kind === 'prose' ? next.html : null };
};

export function Home() {
  const { panel, say } = measure();
  const last = store.lastRegion();
  const lastCh = last ? byNum[last] : undefined;
  const lastShot = last ? store.lastShot(last) : 0;

  return (
    <div className="wrap">
      <section className="hero">
        <Mark className="hero-mark" />
        <h1>{meta.title}</h1>
        <Prose html={opening()} className="lede" />
        <div className="btn-row" style={{ marginTop: '1.6em' }}>
          <Link className="btn btn-go" to="/ch/00">ابدأ من الفصل 00</Link>
          {lastCh && (
            <Link className="btn" to={`/ch/${lastCh.num}#s${lastShot}`}>
              عُد إلى {lastCh.num} · {lastCh.shots[lastShot]?.stage ?? lastCh.title}
            </Link>
          )}
        </div>
      </section>

      {panel && (
        <section className="sec">
          <h2>ثلاثة تشغيلات لبرنامجٍ واحد</h2>
          <Measure panel={panel} sayHtml={say} />
        </section>
      )}

      <section className="sec">
        <h2>ما الذي يُبنى هنا</h2>
        <p style={{ maxWidth: '62ch' }}>{meta.tagline}</p>
        <div className="cols" style={{ marginTop: '1.2em' }}>
          <div className="fam">
            <div className="fam-h"><strong>كل فصلٍ نواةٌ تُقلِع</strong></div>
            <div className="fam-m">
              المرحلة <span className="en">NN</span> بناءٌ كاملٌ يحمل ما شُرح حتى ذلك الفصل ولا شيء بعده.
              وهي {Object.keys(byId).length} مرحلةً في <code>programs/stages.conf</code>.
            </div>
          </div>
          <div className="fam">
            <div className="fam-h"><strong>كل لوحةٍ مخرَجُ إقلاعٍ حقيقيّ</strong></div>
            <div className="fam-m">
              يبنيها <code>tools/verify.py</code> ويقلعها ويقارن. ولكلٍّ وسمٌ يقول من يضمنها.
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <h2>خمس جُمَل يُشتقّ منها الباقي</h2>
        <div className="ax">
          {axioms.map((a) => (
            <div className="ax-i" key={a.n}>
              <span className="ax-n">{a.n}</span>
              <span dangerouslySetInnerHTML={{ __html: inline(a.claim) }} />
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <h2>الطريق</h2>
        <div className="cols cols-road">
          {packs.map((pk) => (
            <div className="pack" key={pk.range}>
              <div className="pack-h">
                <span className="pack-r">{pk.range}</span>
                <span className="pack-t">{pk.title}</span>
              </div>
              <div className="ch-list">
                {chapters
                  .filter((c) => Number(c.num) >= pk.from && Number(c.num) <= pk.to)
                  .map((c) => (
                    <Link className="ch-li" key={c.num} to={`/ch/${c.num}`} data-seen={store.seenIn(c.num) ? '1' : '0'}>
                      <span className="ch-li-n">{c.num}</span>
                      <span>
                        <span dangerouslySetInnerHTML={{ __html: inline(c.titleMd) }} />
                        {gists[c.num] && <span className="ch-li-g"> — <span dangerouslySetInnerHTML={{ __html: inline(gists[c.num]!) }} /></span>}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <h2>قبل أن تبدأ</h2>
        <details className="fam">
          <summary>البيئة التي شُغِّلت فيها كل لوحة</summary>
          <table className="grid" style={{ marginTop: '0.8em' }}>
            <tbody>
              {envRows.map((r) => (
                <tr key={r.what}>
                  <th scope="row">{r.what}</th>
                  <td dangerouslySetInnerHTML={{ __html: inline(r.value) }} />
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <details className="fam" style={{ marginTop: '10px' }}>
          <summary>وسوم السلطة: من يملك تقرير كل ادّعاء</summary>
          <table className="grid" style={{ marginTop: '0.8em' }}>
            <tbody>
              {tagRows.map((r) => (
                <tr key={r.tag}>
                  <th scope="row"><code>@{r.tag}</code></th>
                  <td dangerouslySetInnerHTML={{ __html: inline(r.owner) }} />
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '0.8em' }}><Link to="/sources">كيف تُطوى في أربع عائلاتٍ على اللوحات ←</Link></p>
        </details>
      </section>
    </div>
  );
}
