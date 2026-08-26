/**
 * الإقليم — لقطةً لقطة. **الانتقال بيد القارئ**، بضغطةٍ واحدة في نفس الموضع،
 * وبلا تقدّمٍ تلقائيّ: أذى المقاطع القصيرة في التشغيل التلقائيّ لا في القِصَر.
 *
 * ومعه **أثرُ ما عُبِر** في لوحٍ جانبيّ: يعرف القارئ أين هو، ويرجع إلى أيّ لقطةٍ
 * مرّت بضغطة. وما أمامه واحدٌ يسمّيه زرّ التالية — لا عددَ ولا نسبة.
 *
 * وللإقليم أرضيةٌ مرئيةٌ ينغلق عندها: التمرينُ ثم ما توقّعتَه ثم الخلاصة، ثم
 * البذرةُ التي هي رابط التالي.
 */
import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Shot } from '../components/Shot';
import { NextShot, PrevShot } from '../components/NextShot';
import { Trail } from '../components/Trail';
import { Seed } from '../components/Seed';
import { Prose } from '../components/Prose';
import { Exercise } from '../components/Exercise';
import { Summary } from '../components/Summary';
import { MasteryDiff } from '../components/MasteryDiff';
import { regionOf, nextOf } from '../content/regions';
import { store } from '../lib/store';
import { inline } from '../lib/md';

export function RegionPage() {
  const { no = '', s } = useParams();
  const nav = useNavigate();
  const region = regionOf(no);

  /* موضع اللقطة في المسار: يُشارَك ويُرجَع إليه، ويلتقطه فحص المتصفّح.
     وبلا موضعٍ يفتح حيث وقف القارئ. ولا عددَ إجماليّ في المسار ولا نسبة. */
  const raw = s === undefined ? store.lastShot(no) : Number(s);
  const i = Number.isFinite(raw) ? Math.max(0, Math.min(raw, (region?.shots.length ?? 1) - 1)) : 0;
  const setI = (j: number) => nav(`/r/${no}/${j}`);

  useEffect(() => { if (region) store.see(no, i); }, [no, i, region]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [no, i]);

  if (!region) return <Navigate to="/" replace />;

  const shot = region.shots[i];
  const next = region.shots[i + 1];
  const after = nextOf(no);
  const atFloor = !next;

  /* فرق الإتقان: كل بوّابةٍ أجاب عنها القارئ، بجانب اللوحة التي أجابتها.
     ولا يُعرَض شيءٌ لم يُكتَب — والحقل المحفوظ يُعرَض كلُّه. */
  const diffs = region.shots.flatMap((s) =>
    s.blocks.flatMap((b) => {
      if (b.kind !== 'run') return [];
      return b.panels.flatMap((p) => {
        if (!p.gate) return [];
        const predicted = store.prediction(p.gate.id);
        return predicted ? [{ id: p.gate.id, predicted, was: p.output }] : [];
      });
    })
  );

  return (
    <>
      <TopBar
        where={region.name}
        progress={region.shots.length ? (i + 1) / region.shots.length : undefined}
      />
      <div className="regionshell">
        <main className="main main--region region" id="main">
          <p className="crumb">
            <span className="num en">{region.no}</span>
            {shot?.part ? (
              <>
                <span className="crumb__sep"> · </span>
                <span dangerouslySetInnerHTML={{ __html: inline(shot.part) }} />
              </>
            ) : null}
          </p>

          {i === 0 ? <Prose className="measure lead" html={region.leadHtml} /> : null}

          {shot ? <Shot shot={shot} n={i + 1} region={region.no} /> : null}

          {atFloor ? (
            <div className="floor stack-lg">
              {region.exerciseHtml ? <Exercise html={region.exerciseHtml} /> : null}
              {diffs.length ? (
                <section className="stack">
                  <h2>ما توقّعتَه</h2>
                  {diffs.map((d) => <MasteryDiff key={d.id} predicted={d.predicted} was={d.was} />)}
                </section>
              ) : null}
              {region.summary.length ? (
                <section className="stack">
                  <h2>الخلاصة</h2>
                  <Summary head={region.summaryHead} rows={region.summary} />
                </section>
              ) : null}
            </div>
          ) : null}

          <div className="shotnav">
            {next ? (
              <NextShot title={next.title} onGo={() => setI(i + 1)} />
            ) : region.seedHtml ? (
              <Seed
                html={region.seedHtml}
                to={after ? `/r/${after.no}` : undefined}
                next={after?.name}
              />
            ) : null}
            {i > 0 ? <PrevShot onGo={() => setI(i - 1)} /> : null}
          </div>
        </main>

        <Trail shots={region.shots} at={i} furthest={store.furthest(no)} onGo={setI} />
      </div>
    </>
  );
}
