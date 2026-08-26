/**
 * الواجهة الرئيسية — **مدخلٌ لا فهرس روابط**.
 *
 * ترتيبها ليس ذوقاً: مشهدٌ يقف عليه من لا يعرف شيئاً، ثم **حقيقةٌ واحدة**
 * يقلبها بيده، ثم جوهر المنهج (البديهيات)، ثم من يضمن ماذا، ثم الطريق،
 * **ثم العمق آخراً ومطويّاً** — مئةٌ وثلاثةٌ وثلاثون سطراً قبل أن يعرف القارئ
 * الموضوع تُقرأ تهديداً لا دعوة.
 *
 * **ولا نصَّ محتوًى مكتوباً هنا** (الثابت ٤): العنوان والخطّاف من
 * `../../../curriculum.json`، والبديهيات والسلطات والحِزَم من
 * `../../../README.md`، والبرنامج من `../../../programs/tally.dart`.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { DartMark } from '../components/DartMark';
import { AxiomList } from '../components/AxiomList';
import { PackCard } from '../components/PackCard';
import { Code } from '../components/Code';
import { axioms, packs, authorities } from '../content/readme';
import { regions } from '../content/regions';
import { store } from '../lib/store';
import { inline } from '../lib/md';
import meta from '../../../curriculum.json';
import tally from '../../../programs/tally.dart?raw';

/** الخطّاف جملتان: واحدةٌ عن C وواحدةٌ عن Dart. يُقسَم ولا يُعاد كتابته. */
const SIDES = ((): [string, string] => {
  const i = meta.hook.indexOf('. ');
  return i > 0 ? [meta.hook.slice(0, i + 1), meta.hook.slice(i + 2)] : [meta.hook, ''];
})();

const LINES = tally.trimEnd().split('\n').length;

export function Home() {
  const [side, setSide] = useState<0 | 1>(0);
  const [open, setOpen] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const last = store.lastRegion();
  const first = regions[0];

  return (
    <>
      <TopBar />
      <main className="main home" id="main">
        {/* ١ — المشهد */}
        <section className="hero">
          <DartMark size={92} className="hero__mark" />
          <h1 className="hero__title">{meta.title}</h1>
          <p className="hero__tagline">{meta.tagline}</p>
          <div className="hero__cta">
            {first ? (
              <Link className="cta" to={`/r/${first.no}`}>
                <ArrowLeft aria-hidden />
                <span>ابدأ من الإقليم صفر</span>
              </Link>
            ) : null}
            {last ? (
              <Link className="cta cta--quiet" to={`/r/${last}`}>
                عُد إلى الإقليم <span className="num en">{last}</span>
              </Link>
            ) : null}
          </div>
        </section>

        {/* ٢ — الادّعاء يُقلَب بيد القارئ: وجها الطيّة */}
        <section className="flip">
          <div className="flip__tabs" role="group" aria-label="اللغتان">
            <button type="button" className="chip en" data-on={side === 0} onClick={() => setSide(0)}>C</button>
            <button type="button" className="chip en" data-on={side === 1} onClick={() => setSide(1)}>Dart</button>
          </div>
          <p className="flip__say" key={side}>{SIDES[side]}</p>
        </section>

        {/* ٣ — جوهر المنهج */}
        <header className="section-head">
          <h2>خمسُ بديهيات</h2>
          <span className="section-head__kicker">وأوّل ما يتساقط منها</span>
        </header>
        <AxiomList items={axioms} />

        {/* ٤ — من يضمن ماذا: وسومُ اللوحات كلِّها في الموقع */}
        <header className="section-head">
          <h2>من يضمن ما تقرأ</h2>
          <span className="section-head__kicker">وسمٌ على كل لوحة</span>
        </header>
        <ul className="auth">
          {authorities.map(([tag, means]) => (
            <li key={tag}>
              <span className="mtag en" data-machine={tag}>{tag}</span>
              <span dangerouslySetInnerHTML={{ __html: inline(means) }} />
            </li>
          ))}
        </ul>

        {/* ٥ — الطريق */}
        <header className="section-head">
          <h2>الطريق</h2>
          <span className="section-head__kicker">خمسُ حِزَم</span>
        </header>
        <div className="packgrid">
          {packs.map((p) => (
            <PackCard
              key={p.id}
              pack={p}
              open={open === p.id}
              onToggle={() => setOpen(open === p.id ? null : p.id)}
              regions={regions
                .filter((r) => r.no >= p.from && r.no <= p.to)
                .map((r) => ({ no: r.no, name: r.name }))}
            />
          ))}
        </div>

        {/* ٦ — العمق آخراً، ومطويّاً حتى يُطلَب */}
        <header className="section-head">
          <h2>ما ستكتبه بيدك</h2>
          <span className="section-head__kicker num en">{LINES} lines · Dart</span>
        </header>
        {showCode ? (
          <Code program={{ lang: 'dart', code: tally.trimEnd(), file: 'tally', excerpt: false }} />
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
