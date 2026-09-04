/**
 * صفحة الفصل — قسمٌ واحدٌ في المرّة، والانتقال بيد القارئ.
 *
 * والأرضيّة (التمرين) تُعرَض بعد آخر قسم، ومعها **ما توقّعتَه**: كلُّ ما حُفِظ
 * يُعرَض، بلا نسبةٍ وبلا صواب/خطأ — فالحكم للقارئ.
 *
 * وبنيةُ النصّ هي الملاحة: سطرُ «الفصل التالي» في آخر الماركداون هو ما يسمّي
 * الزرَّ، فلا pager عامّ بجانبه.
 *
 * والانتقال يبدأ من **أعلى** القسم الجديد: قسمٌ نهايتُه مرئيةٌ من بدايته يجب أن
 * يُدخَل من بدايته، وإلّا وقف القارئ في قاع شيءٍ لم يقرأه.
 */
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Blocks, Prose } from '../components/Blocks';
import { Rail } from '../components/Rail';
import { Shot, threeWords } from '../components/Shot';
import { TopBar } from '../components/TopBar';
import { byNum, regions } from '../content/regions';
import { store } from '../lib/store';

export function RegionPage() {
  const { no, s } = useParams();
  const nav = useNavigate();
  const region = byNum(no ?? '00');
  const idx = Number(s ?? '0');

  useEffect(() => {
    if (region && idx >= 0 && idx <= region.shots.length) store.see(region.num, idx);
  }, [region, idx]);

  /* الانتقال يضع القارئ في أعلى القسم الجديد، لا في الموضع الذي كان فيه. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [no, s]);

  if (!region) return <><TopBar /><main className="wrap"><p>لا فصل بهذا الرقم.</p></main></>;

  const last = region.shots.length;
  const at = Math.min(Math.max(idx, 0), last);
  const onFloor = at === last;
  const shot = region.shots[at];
  const nextRegion = regions.find((r) => r.n === region.n + 1);
  const go = (i: number) => nav(`/r/${region.num}/${i}`);

  /* اسمُ ما بعده بثلاث كلمات: خطوةٌ محدّدةٌ رخيصة المظهر لا قفزةٌ في المجهول. */
  const nextLabel = onFloor
    ? nextRegion && `الفصل ${nextRegion.num} · ${threeWords(nextRegion.short)}`
    : region.shots[at + 1]
      ? threeWords(region.shots[at + 1]!.title)
      : region.exercise
        ? 'التمرين'
        : undefined;

  const onNext = onFloor
    ? nextRegion ? () => nav(`/r/${nextRegion.num}/0`) : undefined
    : () => go(at + 1);
  const onPrev = at > 0 ? () => go(at - 1) : () => nav('/');

  return (
    <>
      <TopBar here={`الفصل ${region.num}`} />
      <main className="wrap region" id="main">
        {at === 0 && (
          <>
            <div className="shot__part">الفصل {region.num}</div>
            <Prose className="shot__intro prose-wrap" html={region.intro} />
          </>
        )}

        {shot && !onFloor && (
          <Shot shot={shot} region={region.num} count={last} />
        )}

        {onFloor && (
          <div className="floor">
            <h1 className="shot__title" dangerouslySetInnerHTML={{ __html: region.shortHtml }} />
            {region.exercise && (
              <section className="card card--exercise">
                <div className="card__k">التمرين</div>
                <Blocks blocks={region.exercise} idBase={`${region.num}:ex`} />
              </section>
            )}
            <Predictions region={region.num} shots={last} />
            {region.next && (
              <section className="card card--summary">
                <div className="card__k">الفصل التالي</div>
                <p className="prose-wrap">{region.next}</p>
              </section>
            )}
          </div>
        )}

      </main>

      <Rail
        region={region}
        at={at}
        nextLabel={nextLabel}
        onPrev={onPrev}
        onNext={onNext}
        go={go}
      />
    </>
  );
}

/** كلُّ محفوظٍ يُعرَض: حقلٌ يُحفَظ ولا يُعرَض وعدٌ لم يُنفَّذ. */
function Predictions({ region, shots }: { region: string; shots: number }) {
  const mine: { at: number; text: string }[] = [];
  for (let i = 0; i < shots; i++) {
    for (let g = 0; g < 4; g++) {
      const t = store.prediction(`${region}:${i}:${g}`);
      if (t) mine.push({ at: i, text: t });
    }
  }
  if (!mine.length) return null;
  return (
    <section className="card">
      <div className="card__k">ما توقّعتَه في هذا الفصل</div>
      <div className="trail">
        {mine.map((m) => (
          <div className="trail__row" key={`${m.at}-${m.text}`}>
            <span className="num">{m.at + 1}</span>
            <span className="en">{m.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
