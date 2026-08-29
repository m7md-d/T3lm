/**
 * صفحة الإقليم — لقطةٌ واحدةٌ في المرّة، والانتقال بيد القارئ.
 *
 * والأرضيّة (التمرين والخلاصة) تُعرَض بعد آخر لقطة، ومعها **ما توقّعتَه**:
 * كلُّ ما حفظته البوّابات يُعرَض، بلا نسبةٍ وبلا صواب/خطأ — فالحكم للقارئ.
 * وبنيةُ النصّ هي الملاحة: خلاصةُ الإقليم تنتهي بسؤالٍ يفتحه الذي بعده.
 */
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Blocks, Prose } from '../components/Blocks';
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

  if (!region) return <><TopBar /><main className="wrap"><p>لا إقليم بهذا الرقم.</p></main></>;

  const last = region.shots.length;
  const at = Math.min(Math.max(idx, 0), last);
  const onFloor = at === last;
  const shot = region.shots[at];
  const nextRegion = regions.find((r) => r.n === region.n + 1);
  const go = (i: number) => nav(`/r/${region.num}/${i}`);

  return (
    <>
      <TopBar here={`الإقليم ${region.num}`} />
      <main className="wrap" id="main">
        {at === 0 && (
          <>
            <div className="shot__part">الإقليم {region.num}</div>
            <Prose className="shot__intro prose-wrap" html={region.intro} />
          </>
        )}

        {shot && !onFloor && (
          <Shot shot={shot} region={region.num} count={last} />
        )}

        {onFloor && (
          <div className="floor">
            <h1 className="shot__title" dangerouslySetInnerHTML={{ __html: region.titleHtml }} />
            {region.exercise && (
              <section className="card card--exercise">
                <div className="card__k">التمرين</div>
                <Blocks blocks={region.exercise} idBase={`${region.num}:ex`} />
              </section>
            )}
            {region.summary && (
              <section className="card card--summary">
                <div className="card__k">الخلاصة</div>
                <Blocks blocks={region.summary} idBase={`${region.num}:su`} />
              </section>
            )}
            <Predictions region={region.num} shots={last} />
          </div>
        )}

        <nav className="pager">
          {at > 0 ? (
            <button type="button" className="btn" onClick={() => go(at - 1)}>
              <ArrowRight aria-hidden /> السابق
            </button>
          ) : (
            <Link className="btn" to="/"><ArrowRight aria-hidden /> المدخل</Link>
          )}
          <span className="pager__next">
            {!onFloor && region.shots[at + 1] && (
              <>
                <span className="next__label">{threeWords(region.shots[at + 1]!.title)}</span>
                <button type="button" className="btn btn--go" onClick={() => go(at + 1)}>
                  التالي <ArrowLeft aria-hidden />
                </button>
              </>
            )}
            {!onFloor && !region.shots[at + 1] && (
              <>
                <span className="next__label">{region.exercise ? 'التمرين' : 'الطريق'}</span>
                <button type="button" className="btn btn--go" onClick={() => go(last)}>
                  التالي <ArrowLeft aria-hidden />
                </button>
              </>
            )}
            {onFloor && nextRegion && (
              <>
                <span className="next__label">{threeWords(nextRegion.short)}</span>
                <Link className="btn btn--go" to={`/r/${nextRegion.num}/0`}>
                  الإقليم {nextRegion.num} <ArrowLeft aria-hidden />
                </Link>
              </>
            )}
          </span>
        </nav>
      </main>
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
      <div className="card__k">ما توقّعتَه في هذا الإقليم</div>
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
