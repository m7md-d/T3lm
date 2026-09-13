import { familyOf, TAG_TEXT } from '../lib/authority';
import { tagMeans } from '../content/plan';
import { lexOutput } from '../lib/outlex';
import { inline } from '../lib/md';
import type { Panel } from '../lib/types';

/**
 * لوحة مخرَج — **مسجَّلة**، لا تُشغَّل هنا ولا تلبس محثّاً حيّاً.
 *
 * النواة تُقلِع على QEMU بصورة ISO، ولا محرّك متصفّحٍ يفعل ذلك — فلا زرّ
 * تشغيلٍ في هذا الموقع أصلاً (الركيزة ٨ب). ويبقى للقارئ سطرُ الأمر.
 *
 * ولها ثلاثة توسيمات، كلُّها من المصدر: **الوسم** يقول من يضمنها، و**لونُ
 * الحدّ** عائلتَه، و**المرحلة** تقول أيَّ نواةٍ أُقلِعت لإنتاجها.
 */
export function OutputPanel({ p }: { p: Panel }) {
  const fam = familyOf(p.tag);
  const broken = !!p.stage && /x$/.test(p.stage);
  return (
    <figure className="panel" data-fam={fam} data-broken={broken ? '1' : '0'}>
      <div className="panel-top">
        {p.titleMd && <span className="panel-t" dangerouslySetInnerHTML={{ __html: inline(p.titleMd) }} />}
        <span className="panel-sp" />
        {p.stage && (
          <span className="stage-chip" data-broken={broken ? '1' : '0'} title="المرحلة التي أُقلعت">
            stage {p.stage}
          </span>
        )}
        <span className="tag" data-fam={fam} title={tagMeans[p.tag]}>{TAG_TEXT[p.tag]}</span>
      </div>
      {p.note && <div className="panel-note prose" dangerouslySetInnerHTML={{ __html: inline(p.note) }} />}
      <pre><code dangerouslySetInnerHTML={{ __html: lexOutput(p.text) }} /></pre>
      {p.stage && (
        <figcaption className="panel-foot">
          مخرَجٌ مسجَّل. وعندك: <code>./build.sh {p.stage} run</code>
        </figcaption>
      )}
    </figure>
  );
}
