import { Link } from 'react-router-dom';
import { chapters } from '../content/regions';
import { store } from '../lib/store';
import { inline } from '../lib/md';

/**
 * الأثر — **محتوًى لا نقاط** (الركيزة ١٠).
 *
 * والأسلوب §١٠ عرّف «مكتمل» بنفسه: خمسةُ artifacts لكل وحدة. فما يتراكم هنا
 * هو تلك الصفوف، وما كتبه القارئ في `Checkpoint` — لا عدَّ ولا نسبة ولا سلسلة.
 */
export function Trail() {
  const reached = chapters.filter((c) => store.seenIn(c.num) > 0);

  if (!reached.length) {
    return (
      <div className="wrap narrow">
        <h1 className="ch-title">الأثر</h1>
        <p className="ch-sub">
          كل فصلٍ يعرّف ما يجب أن تنتجه قبل أن يُعدّ مكتملاً. وما تمرّ به يظهر هنا.
        </p>
        <div className="empty">لم تبدأ بعد. <Link to="/ch/00">الفصل 00</Link></div>
      </div>
    );
  }

  return (
    <div className="wrap narrow">
      <h1 className="ch-title">الأثر</h1>
      <p className="ch-sub">ما مررتَ به، وما يطلبه كل فصلٍ منك قبل أن يُعدّ مكتملاً.</p>

      {reached.map((c) => {
        const notes = c.checkpoint
          .map((q, i) => ({ q, a: store.prediction(`cp:${c.num}:${i}`) }))
          .filter((x) => x.a);
        const expect = store.prediction(`src:${c.num}`);
        return (
          <section className="trail-ch" key={c.num}>
            <div className="trail-h">
              <span className="ch-li-n">{c.num}</span>
              <Link to={`/ch/${c.num}`} dangerouslySetInnerHTML={{ __html: inline(c.titleMd) }} />
            </div>

            {c.artifact.length > 0 && (
              <div className="art">
                {c.artifact.map((r, i) => (
                  <div className="art-row" key={i}>
                    <span className="art-k">{r.label}</span>
                    <span className="prose" dangerouslySetInnerHTML={{ __html: inline(r.body) }} />
                  </div>
                ))}
              </div>
            )}

            {expect && (
              <div className="cp-q" style={{ marginTop: '10px' }}>
                <span className="cp-k">قبل فتح المصدر</span>
                <div className="cp-t">{expect}</div>
              </div>
            )}

            {notes.map((n, i) => (
              <div className="cp-q" key={i} style={{ marginTop: '10px' }}>
                <div className="cp-ask prose" dangerouslySetInnerHTML={{ __html: inline(n.q) }} />
                <div className="cp-said">{n.a}</div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
