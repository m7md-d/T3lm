/**
 * الواجهة الرئيسية — **مدخلٌ مريح**، لا فهرس روابط ولا أوّل درس.
 *
 * ترتيبها ليس ذوقاً (الركيزة ٣ب): مشهدٌ يقف عليه من لا يعرف شيئاً، ثم **حقيقةٌ
 * واحدة** تعطيه الصورة، ثم لحظةُ تفاعلٍ يقلبها بيده، ثم جوهر المنهج، ثم الطريق،
 * **ثم العمق آخراً ومطويّاً**.
 *
 * والكود لا يُصفَع في وجه الداخل: `box.c` موتيف هذه الصفحة، ومع ذلك يُعرَض في
 * أسفلها لمحةً تُفتَح بطلب — بلوكٌ طويل قبل أن يعرف القارئ ما الموضوع يُقرأ
 * تهديداً لا دعوة.
 *
 * ومصطلحات الشاشة الأولى معدودة: «كونتينر» و«نواة لينكس» وحدهما. وسطرُ المنهج
 * التعريفيّ — وفيه `runc` و`containerd` — مؤجَّلٌ إلى قسم الطريق حيث صار له معنى.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Unlink } from 'lucide-react';
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
  const [showCode, setShowCode] = useState(false);
  const last = store.lastRegion();

  const lit = open ?? hover;
  const hit = lit ? packages.find((p) => p.id === lit)?.lines ?? [] : [];
  const first = regions[0];

  return (
    <>
      <TopBar />
      <main className="main" id="main">
        {/* ١ — المشهد: كلمةٌ واحدة، وحقيقةٌ واحدة تحتها */}
        <section className="hero">
          <h1 className="hero__word">كونتينر</h1>
          <p className="hero__hook">{meta.hook}</p>
          <div className="hero__cta">
            {first ? (
              <Link className="cta" to={`/r/${first.no}`}>
                <ArrowLeft aria-hidden />
                <span>ابدأ من البداية</span>
              </Link>
            ) : null}
            {last ? <Link className="cta cta--quiet" to={`/r/${last}`}>عُد إلى الإقليم <span className="num en">{last}</span></Link> : null}
          </div>
        </section>

        {/* ٢ — الصورة بالفعل لا بالوصف: ادّعاءٌ يقلبه القارئ بيده */}
        <section className="tear">
          <div className="tear__head">
            <h2>فما هي إذاً؟</h2>
            <button type="button" className="hero__tear" onClick={() => setTorn((v) => !v)}>
              <Unlink aria-hidden />
              <span>{torn ? 'أعِدها كلمةً' : 'فكّك الكلمة'}</span>
            </button>
          </div>
          <p className="tear__say">
            {torn
              ? 'أربعُ خصائصَ على عملية. كلٌّ منها بدائيةٌ مستقلّة في النواة، وتُلبَس وحدها.'
              : 'اضغط لترى ما تحتها.'}
          </p>
          <ProcessCard on={torn ? [...FIELDS] : []} />
        </section>

        {/* ٣ — جوهر المنهج */}
        <header className="section-head">
          <h2>خمسُ بديهيات</h2>
          <span className="section-head__kicker">وأوّل ما يتساقط منها</span>
        </header>
        <AxiomList items={axioms} />

        {/* ٤ — الطريق، مجمَّعاً */}
        <header className="section-head">
          <h2>الطريق</h2>
          <span className="section-head__kicker">ثمانِ حِزَم</span>
        </header>
        <p className="measure lead-dim">{meta.tagline}.</p>
        <div className="pkggrid" style={{ marginTop: 'var(--dk-gap-lg)' }}>
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

        {/* ٥ — العمق آخراً، ومطويّاً حتى يُطلَب */}
        <header className="section-head">
          <h2>ما ستكتبه بيدك</h2>
          <span className="section-head__kicker num en">{BOX_LINE_COUNT} lines · C</span>
        </header>
        <p className="measure lead-dim">
          عازلٌ يبنيه القارئ في الإقليم الأوّل، وكلُّ حزمةٍ بعده تفكّك سطراً منه.
        </p>
        {showCode ? (
          <div style={{ marginTop: 'var(--dk-gap)' }}>
            <BoxMap hit={hit} />
          </div>
        ) : (
          <button type="button" className="peek" onClick={() => setShowCode(true)}>
            <ChevronDown aria-hidden />
            <span>افتح البرنامج</span>
          </button>
        )}
      </main>
    </>
  );
}
