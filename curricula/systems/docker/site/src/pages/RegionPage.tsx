/**
 * الإقليم — لقطةً لقطة. **الانتقال بيد القارئ**، بضغطةٍ واحدة في نفس الموضع،
 * وبلا تقدّمٍ تلقائيّ: أذى المقاطع القصيرة في التشغيل التلقائيّ لا في القِصَر
 * (التقطيع بتحكّم المتعلّم: d = 0.50–0.70).
 *
 * ومعه **أثرُ ما عُبِر** في لوحٍ جانبيّ: يعرف القارئ أين هو، ويرجع إلى أيّ لقطةٍ
 * مرّت بضغطة. وما أمامه واحدٌ يسمّيه زرّ التالي — لا عددَ ولا نسبة.
 *
 * وللإقليم أرضيةٌ مرئيةٌ ينغلق عندها: الخلاصةُ ثم البذرةُ التي هي رابط التالي.
 */
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Shot } from '../components/Shot';
import { NextShot } from '../components/NextShot';
import { PrevShot } from '../components/PrevShot';
import { ShotTrail } from '../components/ShotTrail';
import { Seed } from '../components/Seed';
import { Prose } from '../components/Prose';
import { Exercise } from '../components/Exercise';
import { SummaryTable } from '../components/SummaryTable';
import { MasteryDiff } from '../components/MasteryDiff';
import { regionOf, nextOf } from '../content/regions';
import { packageOf } from '../content/packages';
import { store } from '../lib/store';

export function RegionPage() {
  const { no = '' } = useParams();
  const region = regionOf(no);
  const [i, setI] = useState(() => store.lastShot(no));

  useEffect(() => { if (region) store.see(no, i); }, [no, i, region]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [i]);

  if (!region) return <Navigate to="/" replace />;

  const shot = region.shots[i];
  const next = region.shots[i + 1];
  const nextRegion = nextOf(no);
  const pkg = packageOf(no);
  const atFloor = !next;

  /* فرق الإتقان: كل بوّابةٍ أجاب عنها القارئ، بجانب اللوحة التي تلتها.
     ولا يُعرَض شيءٌ لم يُكتَب — والحقل المحفوظ يُعرَض كلُّه. */
  const diffs = region.shots.flatMap((s) =>
    s.blocks.flatMap((b, k) => {
      if (b.kind !== 'gate') return [];
      const predicted = store.prediction(b.id);
      const after = s.blocks[k + 1];
      if (!predicted || after?.kind !== 'panel') return [];
      return [{ id: b.id, predicted, was: after.output }];
    })
  );

  return (
    <>
      <TopBar
        where={region.title}
        progress={region.shots.length ? (i + 1) / region.shots.length : undefined}
      />
      <div className="regionshell">
        <main className="main main--region" id="main">
          {pkg ? (
            <p className="crumb">
              <Link to={`/p/${pkg.id}`}>{pkg.name}</Link>
              <span className="crumb__sep"> · </span>
              <span className="num en">{region.no}</span>
            </p>
          ) : null}

          {i === 0 ? <Prose className="measure" html={region.leadHtml} /> : null}

          {shot ? <Shot shot={shot} n={i + 1} /> : null}

          {atFloor ? (
            <div className="floor stack-lg">
              {region.exercise ? <Exercise count={region.exercise.count} html={region.exercise.html} /> : null}
              {diffs.length ? (
                <section className="stack">
                  <h2>ما توقّعتَه</h2>
                  {diffs.map((d) => <MasteryDiff key={d.id} predicted={d.predicted} was={d.was} />)}
                </section>
              ) : null}
              {region.summary?.rows.length ? (
                <section className="stack">
                  <h2>أين نحن في الشجرة</h2>
                  <SummaryTable rows={region.summary.rows} />
                </section>
              ) : null}
            </div>
          ) : null}

          <div className="shotnav">
            {next ? (
              <NextShot title={next.title} onGo={() => setI(i + 1)} />
            ) : region.seed ? (
              <Seed
                html={region.seed.html}
                to={nextRegion ? `/r/${nextRegion.no}` : undefined}
                next={nextRegion?.title}
              />
            ) : nextRegion ? (
              <Link className="next" to={`/r/${nextRegion.no}`}>
                <span>
                  <span className="next__label">الإقليم التالي</span>
                  <br />
                  <span className="next__title">{nextRegion.title}</span>
                </span>
              </Link>
            ) : null}
            {i > 0 ? <PrevShot onGo={() => setI(i - 1)} /> : null}
          </div>
        </main>

        <ShotTrail
          shots={region.shots}
          at={i}
          furthest={store.furthest(no)}
          onGo={setI}
          part={shot?.part}
        />
      </div>
    </>
  );
}
