/**
 * «ما توقّعتَه» — التوقّع بجانب ما كان.
 *
 * البوّابة تحفظ التوقّع عند كتابته (`kit/progress`)، وهذا يجمع ما كُتب في
 * المنهج كلّه فيصير **فرقُ الإتقان** مرئياً بعد أن كان لحظياً: القارئ يرى أين
 * خانه حدسه، لا كم أصاب.
 *
 * ولا نسبة ولا درجة: الحكم للقارئ — لا نعرف صواب جملةٍ كتبها بلغته، وادّعاءُ
 * معرفتها تلعيبٌ يمنعه الأسلوب.
 */
import { Link } from 'react-router-dom';
import { regions, shotsOf } from '../lib/content';
import { store } from '../lib/store';
import { inline } from '../lib/inline';

interface Row { num: string; at: number; title: string; mine: string; real: string }

export default function Gap() {
  const rows: Row[] = regions.flatMap((r) =>
    shotsOf(r).flatMap((s, at) =>
      [...s.blocks, ...(s.pair?.blocks ?? [])]
        .filter((b) => b.type === 'gate')
        .map((b) => ({
          num: r.num,
          at,
          title: s.title,
          mine: store.prediction((b as { id: string }).id) ?? '',
          real: (b as { text: string }).text,
        }))
        .filter((x) => x.mine.trim())
    )
  );

  if (!rows.length) return null;

  return (
    <section className="gap">
      <h2>ما توقّعتَه</h2>
      <p className="gap-note">
        توقّعك محفوظٌ عندك وحدك، وبجانبه ما كان. والحكم لك.
      </p>
      <ol>
        {rows.map((x) => (
          <li key={`${x.num}-${x.at}-${x.mine.slice(0, 8)}`}>
            <Link className="where" to={`/r/${x.num}?s=${x.at}`}>
              <span className="num en">{x.num}</span>
              <b>{inline(x.title)}</b>
            </Link>
            <p className="mine"><span>توقّعتَ</span> {x.mine}</p>
            <pre className="report en"><code>{x.real}</code></pre>
          </li>
        ))}
      </ol>
    </section>
  );
}
