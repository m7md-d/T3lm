/**
 * الواجهة — **خريطتها شجرةُ مجلّدات**.
 *
 * منهجٌ يقول إن شكل المشروع ادّعاءٌ يجب أن يبرهن على نفسه بشكله. فالفصول تُعرَض
 * كما تُعرَض شجرة مشروع، ولكلٍّ **أوّل جملةٍ من نبذته** — لا وسمٌ مكرّر يجعل
 * الأربعةَ عشرَ واحداً (ركيزة ٢ب).
 */
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import { PRINCIPLES, ROAD, intro, regions, sealed } from '../lib/content';
import { inline as withCode } from '../lib/inline';
import { store } from '../lib/store';
import Compare from '../components/Compare';
import Gap from '../components/Gap';


export default function Home() {
  const last = store.lastRegion();
  const concerns = intro.sections.find((s) => /^النظام/.test(s.title))?.raw ?? '';
  const six = [...concerns.matchAll(/^\| `([a-z]+)` \| ([^|]+) \|/gm)].map((m) => [m[1]!, m[2]!.trim()]);

  return (
    <div className="home">
      <section className="hero">
        <h1>أين يسكن كل شيء، ولماذا</h1>
        <p className="tag">
          اثنتا عشرة هيكلة، ونظامٌ واحد يُعاد إسكانه فيها كلّها، وخمسةُ تغييراتٍ
          ثابتة تُقاس عليه في كل مرّة.
        </p>
        <p className="tag dim">
          كل رقمٍ في هذا المنهج مخرَجُ أمر. وحدود جهاز القياس مكتوبةٌ في الفصل ٠٠.
        </p>
        {six.length > 0 && (
          <ul className="concerns" aria-label="اهتمامات النظام">
            {six.map(([k, v]) => (
              <li key={k}><span className="en">{k}</span><em>{v}</em></li>
            ))}
          </ul>
        )}
      </section>

      <section className="principles">
        <h2>خمسة مبادئ، كلٌّ منها يُقاس</h2>
        <ol>
          {PRINCIPLES.map((p) => (
            <li key={p.n}>
              <span className="pn">{p.n}</span>
              <b>{withCode(p.short)}</b>
              <em>{withCode(p.falls)}</em>
            </li>
          ))}
        </ol>
      </section>

      <Compare />

      <section className="map">
        <h2>الطريق</h2>
        <div className="road" role="list">
          <span className="root en">regions/</span>
          {ROAD.map((s) => {
            const r = regions.find((x) => x.num === s.num);
            const seen = r ? store.seenIn(r.num) : 0;
            const inner = (
              <>
                <span className="num en">{s.num}</span>
                <b>{s.title}</b>
                <span className="hook">{withCode(r ? r.hook : s.gist)}</span>
                {seen > 0 && <em className="seen">عبرتَ {seen}</em>}
              </>
            );
            return r
              ? <Link key={s.num} role="listitem" className="stop" to={`/r/${s.num}`}>{inner}</Link>
              : <span key={s.num} role="listitem" className="stop locked">{inner}</span>;
          })}
        </div>
        {sealed.length > 0 && (
          <p className="map-note">المقفلة معلنةٌ في الطريق وتُبنى.</p>
        )}
        {last && (
          <p className="resume">
            توقّفتَ في <Link to={`/r/${last}`}>الإقليم {last}</Link>.
          </p>
        )}
      </section>

      <Gap />

      <section className="intro">
        {intro.sections
          .filter((s) => /لمن كُتب|المشكلة التي|كيف تُدرَس|أدواتك|التغييرات الخمسة/.test(s.title))
          .map((s) => (
            <details key={s.id}>
              <summary>{s.title}</summary>
              <div className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(s.raw) as string }} />
            </details>
          ))}
      </section>
    </div>
  );
}
