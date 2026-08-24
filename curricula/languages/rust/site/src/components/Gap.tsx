/**
 * «ما توقّعتَه» — التوقّع بجانب المخرَج المسجَّل.
 *
 * البوّابة تحفظ التوقّع عند كتابته، وهذا يجمع ما كُتب في المنهج كلّه: القارئ
 * يرى **أين خانه حدسه** بعد أن كان الفرق لحظياً في موضعه.
 *
 * ولا نسبة ولا درجة — الحكم للقارئ. ونحن لا نعرف صواب جملةٍ كتبها بلغته،
 * وادّعاءُ معرفتها تلعيبٌ يمنعه الأسلوب.
 */
import { Link } from 'react-router-dom';
import { regions } from '../lib/content';
import { buildStations } from '../lib/structure';
import { store } from '../lib/store';

export default function Gap() {
  const rows = regions.flatMap((r) =>
    buildStations(r.chapter.sections, r.num).flatMap((s, at) =>
      s.blocks
        .filter((b) => b.type === 'gate')
        .map((b) => ({
          num: r.num,
          at,
          title: s.title,
          mine: store.prediction((b as { id: string }).id) ?? '',
          real: (b as { output: string }).output,
        }))
        .filter((x) => x.mine.trim())
    )
  );

  if (!rows.length) return null;

  return (
    <section className="gap">
      <h2>ما توقّعتَه</h2>
      <p className="gap-note">توقّعك محفوظٌ عندك وحدك، وبجانبه ما كان. والحكم لك.</p>
      <ol>
        {rows.map((x) => (
          <li key={`${x.num}-${x.at}-${x.mine.slice(0, 8)}`}>
            <Link className="where" to={`/r/${x.num}?s=${x.at}`}>
              <i className="en">{x.num}</i>
              <b>{x.title}</b>
            </Link>
            <p className="mine"><span>توقّعتَ</span> {x.mine}</p>
            <pre className="rec-body en">{x.real}</pre>
          </li>
        ))}
      </ol>
    </section>
  );
}
