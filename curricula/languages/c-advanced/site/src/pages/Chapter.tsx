/**
 * الفصل — قسمٌ واحدٌ في الشاشة، والانتقال بيد القارئ في نفس الموضع دائماً.
 * ولا تقدّم تلقائيّ، ولا عدد إجماليّ.
 */
import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Blocks } from '../components/Blocks';
import { ChapterRail } from '../components/ChapterRail';
import { ShotNav } from '../components/ShotNav';
import { Title } from '../components/Title';
import { TopBar } from '../components/TopBar';
import { chapterAt, chapters } from '../content/regions';
import { packOf, verifyCommand } from '../content/plan';
import { store } from '../lib/store';

export function ChapterPage() {
  const { num = '', shot } = useParams();
  const ch = chapterAt(num);
  const at = shot === undefined ? -1 : Number(shot);

  useEffect(() => {
    if (!ch) return;
    document.title = `${ch.title} — C المتقدّم`;
    if (at >= 0) store.see(ch.num, at);
    window.scrollTo(0, 0);
  }, [ch, at]);

  if (!ch) return <Navigate to="/" replace />;
  if (at >= ch.shots.length || at < -1 || Number.isNaN(at)) return <Navigate to={`/f/${ch.num}`} replace />;

  const i = chapters.findIndex((c) => c.num === ch.num);
  const nextCh = chapters[i + 1];
  const prevCh = chapters[i - 1];
  const pack = packOf(ch.num);

  const prev =
    at > 0 ? { to: `/f/${ch.num}/${at - 1}`, title: ch.shots[at - 1]!.titleMd }
    : at === 0 ? { to: `/f/${ch.num}`, title: ch.heading }
    : prevCh ? { to: `/f/${prevCh.num}/${Math.max(0, prevCh.shots.length - 1)}`, title: prevCh.heading }
    : undefined;

  const isLast = at === ch.shots.length - 1;
  const next =
    at < ch.shots.length - 1 ? { to: `/f/${ch.num}/${at + 1}`, title: ch.shots[at + 1]!.titleMd }
    : nextCh ? { to: `/f/${nextCh.num}`, title: nextCh.heading }
    : undefined;

  return (
    <>
      <TopBar where={ch.title} bar />
      <div className="page">
        <aside className="side">
          {pack ? (
            <p className="side-pack">
              <span className="side-range en">{pack.range}</span>
              {pack.title}
            </p>
          ) : null}
          <ChapterRail ch={ch} at={at} />
        </aside>

        <main id="main" className="main">
          {at === -1 ? (
            <>
              <p className="ch-n en">{ch.num}</p>
              <Title as="h1" md={ch.heading} className="ch-h" />
              <Blocks blocks={ch.lead} />
            </>
          ) : (
            <article className="shot">
              <Title as="h2" md={ch.shots[at]!.titleMd} className="shot-h" />
              <Blocks blocks={ch.shots[at]!.blocks} />
            </article>
          )}

          {isLast && ch.seedHtml ? (
            <aside className="seed">
              <span className="seed-label">الفصل التالي</span>
              <div className="seed-body" dangerouslySetInnerHTML={{ __html: ch.seedHtml }} />
            </aside>
          ) : null}

          <ShotNav
            prev={prev}
            next={next}
            nextKind={isLast ? 'الفصل التالي' : at === -1 ? 'أوّل قسم' : 'القسم التالي'}
          />

          {at === -1 ? (
            <footer className="repro">
              <p className="repro-say">أعد تشغيل لوحات هذا الفصل في صورة المختبر:</p>
              <pre className="repro-cmd en"><code>{verifyCommand} {ch.num}</code></pre>
              <Link className="repro-go" to="/lab">كيف تُبنى الصورة ←</Link>
            </footer>
          ) : null}
        </main>
      </div>
    </>
  );
}
