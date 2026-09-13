import { byId, delta } from '../content/stages';

/**
 * ما في نواتك الآن — من `../../programs/stages.conf` حرفياً.
 *
 * «المرحلة `NN` بناءٌ كاملٌ يحمل ما شُرح حتى ذلك الفصل **ولا شيء بعده**»
 * (`../../README.md` §كيف يُدرَس). فالسؤال «ماذا بنيتُ حتى الآن» له جوابٌ
 * بياناً لا وعداً.
 *
 * والفرق عن المرحلة السابقة معروضٌ كما هو: البناء **لا يتراكم بالضرورة** —
 * المرحلة `18` تُسقِط `thread.c` و`sched.c` لأن عرض PCI لا يحتاجهما. وإخفاء
 * ذلك يكذب.
 */
export function Build({ stage }: { stage: string }) {
  const s = byId[stage];
  if (!s) return null;
  const d = delta(stage);
  const isNew = new Set(d.added);

  return (
    <section className="build" aria-label="بناء هذه المرحلة">
      <div className="build-top">
        <span className="build-h">نواةُ هذا الفصل</span>
        <span className="stage-chip">stage {s.id}</span>
        <span className="build-sp" style={{ flex: 1 }} />
        <code className="build-cmd">./build.sh {s.id} run</code>
      </div>
      <div className="build-files">
        {s.files.map((f) => (
          <span className="file" key={f} data-new={isNew.has(f) ? '1' : '0'}>{f}</span>
        ))}
        {d.removed.map((f) => (
          <span className="file" key={`-${f}`} data-gone="1" title="خرج من هذا البناء">{f}</span>
        ))}
      </div>
      {d.prev && (
        <div className="build-foot">
          {d.added.length > 0 && <>الجديد عن المرحلة {d.prev}: <b>{d.added.join(' · ')}</b>. </>}
          {d.removed.length > 0 && <>وما خرج: {d.removed.join(' · ')}.</>}
          {d.added.length === 0 && d.removed.length === 0 && <>نفس ملفّات المرحلة {d.prev}.</>}
        </div>
      )}
    </section>
  );
}
