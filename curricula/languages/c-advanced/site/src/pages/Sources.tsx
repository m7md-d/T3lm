/**
 * من يضمن؟ — محورُ ملاحةٍ ثانٍ. المنهج شبكةٌ (فصلٌ × جهةٌ تقرّر) لا سلسلة.
 * والجدول من `../../../README.md`، والأعداد من `regions/`.
 */
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { FAMILIES, FAMILY_MEANS, FAMILY_NAME, TAGS, TAG_MEANS, TAG_TEXT, familyOf } from '../lib/authority';
import { chapters } from '../content/regions';
import { sources } from '../content/plan';
import type { Family } from '../lib/types';

const count = (f: Family) =>
  chapters.reduce((n, c) => n + c.panels.filter((p) => p.family === f).length, 0);

const chaptersOf = (f: Family) =>
  chapters
    .map((c) => ({ c, n: c.panels.filter((p) => p.family === f).length }))
    .filter((x) => x.n > 0);

export function SourcesPage() {
  return (
    <>
      <TopBar where="من يضمن؟" />
      <main id="main" className="doc">
        <h1 className="doc-h">من يضمن؟</h1>
        <p className="lede">
          سؤال «من قرّر؟» من المنهج الأوّل يتّسع هنا، لأن الأطراف صارت أكثر. وكلُّ لوحةٍ
          تحمل جهتها، <strong>وما بلا وسمٍ تضمنه ISO C</strong>.
        </p>

        <h2 className="h2">الجهات العشر</h2>
        <table className="tbl">
          <thead><tr><th>الجهة</th><th>تقرّر</th></tr></thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.name}>
                <td dangerouslySetInnerHTML={{ __html: s.name }} />
                <td dangerouslySetInnerHTML={{ __html: s.decides }} />
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="h2">تسعةُ وسومٍ في أربع فئات</h2>
        <p className="lede">
          حدُّ الفئات اللونية أربع، فتُطوى الوسوم فيها ويبقى اسم الجهة نصّاً على اللوحة.
          و<code className="en">@ub</code> خارجها: لا أحد يعد بشيء، فلا يأخذ لوناً.
        </p>
        <table className="tbl tbl-tags">
          <thead><tr><th>الوسم</th><th>الفئة</th><th>ما يعنيه في الفاحص</th></tr></thead>
          <tbody>
            {TAGS.map((t) => {
              const f = familyOf(t);
              return (
                <tr key={t}>
                  <td><code className={`src-tag en src-${f}`}>{TAG_TEXT[t]}</code></td>
                  <td><span className={`skey-name fam-${f}`}>{FAMILY_NAME[f]}</span></td>
                  <td>{TAG_MEANS[t]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="fine">
          و<code className="en">@impl</code> وحده يقع في جهتين، فيُقسَم بما تسمّيه ملاحظتُه:
          glibc و<code className="en">ld.so</code> إلى النظام، وgcc وGNU ld إلى سلسلة الأدوات.
        </p>

        <h2 className="h2">أين تقرّر كلُّ جهة</h2>
        {FAMILIES.map((f) => {
          const list = chaptersOf(f);
          return (
            <section key={f} className={`fam fam-${f}`}>
              <header className="fam-head">
                <h3 className="fam-h">{FAMILY_NAME[f]}</h3>
                <span className="fam-n en">{count(f)}</span>
              </header>
              <p className="fam-means">{FAMILY_MEANS[f]}</p>
              <p className="fam-list">
                {list.map(({ c, n }) => (
                  <Link key={c.num} className="chip" to={`/f/${c.num}`} title={c.title}>
                    <span className="en">{c.num}</span>
                    {n > 1 ? <span className="chip-n en">{n}</span> : null}
                  </Link>
                ))}
              </p>
            </section>
          );
        })}
      </main>
    </>
  );
}
