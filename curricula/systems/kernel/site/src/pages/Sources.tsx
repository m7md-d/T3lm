import { FAMILIES, FAMILY_MEANS, FAMILY_NAME, TAGS, TAG_TEXT, familyOf } from '../lib/authority';
import { limitLine, tagMeans } from '../content/plan';
import { LEX_KEY } from '../lib/outlex';
import { chapters } from '../content/regions';
import { inline } from '../lib/md';

/**
 * من يضمن — مفتاحُ اللون ومعجمُ المخرَج في صفحةٍ واحدة.
 *
 * والوسوم ثمانيةٌ في `../../README.md` §البيئة، والعائلات أربعٌ لأن الأدلّة §٨
 * تحدّها بأربع. و`@unspec` بلا لون: لا جهةَ تُصبَغ حين لا يقرّره أحد.
 */
export function Sources() {
  const used = new Map<string, number>();
  for (const c of chapters) for (const p of c.panels) used.set(p.tag, (used.get(p.tag) ?? 0) + 1);

  return (
    <div className="wrap narrow">
      <h1 className="ch-title">من يضمن</h1>
      <p className="ch-sub">
        لكل لوحةِ مخرَجٍ في هذا المنهج وسمٌ يقول من يملك تقرير ادّعائها. واللون على حدّ
        اللوحة هو عائلةُ ذلك الوسم، ونصُّه مكتوبٌ بجانبه.
      </p>

      <section className="sec">
        <h2>العائلات الأربع</h2>
        <div className="cols">
          {FAMILIES.map((f) => (
            <div className="fam" key={f}>
              <div className="fam-h">
                <span className="swatch" data-fam={f} aria-hidden="true" />
                <strong>{FAMILY_NAME[f]}</strong>
              </div>
              <div className="fam-m">{FAMILY_MEANS[f]}</div>
              <div className="tag-row">
                {TAGS.filter((t) => familyOf(t) === f).map((t) => (
                  <span className="tag" data-fam={f} key={t}>{TAG_TEXT[t]}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <h2>الوسوم الثمانية</h2>
        <table className="grid">
          <tbody>
            {TAGS.map((t) => (
              <tr key={t}>
                <th scope="row"><span className="tag" data-fam={familyOf(t)}>{TAG_TEXT[t]}</span></th>
                <td dangerouslySetInnerHTML={{ __html: inline(tagMeans[t] ?? '') }} />
                <td className="num">{used.get(t) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fam-m">والعمود الأخير عددُ اللوحات الحاملة للوسم في هذا المنهج.</p>
      </section>

      <section className="sec">
        <h2>وداخل اللوحة: لون الرمز هو لون مالكه</h2>
        <p className="fam-m" style={{ marginBottom: '1em' }}>
          سطرُ المخرَج ليس نصّاً واحداً. فيه اسمٌ تفرضه المعمارية، واسمٌ سمّاه كودُنا،
          ورقمٌ من هذا التشغيل بعينه — ولكلٍّ لونُ جهته.
        </p>
        <div className="cols">
          {LEX_KEY.map((k) => (
            <div className="fam" key={k.kind}>
              <div className="fam-h">
                <span className="swatch" data-fam={k.kind} aria-hidden="true" />
                <strong>{FAMILY_NAME[k.kind]}</strong>
              </div>
              <div className="fam-m prose" dangerouslySetInnerHTML={{ __html: inline(k.what) }} />
            </div>
          ))}
        </div>
      </section>

      <section className="sec">
        <h2>وحدُّ ذلك كلِّه</h2>
        <div className="limit">
          <span className="limit-mark" aria-hidden="true">⚠</span>
          <div className="prose" dangerouslySetInnerHTML={{ __html: inline(limitLine) }} />
        </div>
      </section>
    </div>
  );
}
