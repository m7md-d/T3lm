/**
 * شريطُ الأحجام — موتيف الموقع، ومصدرُه أن المنهج **يقيس البايتات** ويعود إلى
 * الرقم نفسه أربع مرّات: الفصل `02` يزنه، و`17` يقول لماذا `list` مصفوفةُ
 * إشارات، و`18` يستبدل التخزين، و`21` يقيس ما ربحه.
 *
 * والصفوف تُستخرَج من مخرَج الفصل `02` (`../content/facts.ts`) ولا تُكتَب هنا.
 * والمقياس لوغاريتميّ لأن المدى ٢٨ إلى ٨٣٢٠ بايتاً: خطّيّاً يختفي الصفّ الأوّل.
 */
import type { Size } from '../content/facts';

export function Sizes({ rows, reveal }: { rows: Size[]; reveal?: boolean }) {
  const max = Math.max(...rows.map((r) => r.bytes), 2);
  return (
    <div className="ladder">
      {rows.map((r) => (
        <div className="ladder__row" key={r.what}>
          <div>
            <div className="ladder__name en">{r.what}</div>
            <div className="ladder__track">
              <i
                className="ladder__fill"
                style={{
                  width: reveal
                    ? `${Math.max(2, (Math.log10(r.bytes) / Math.log10(max)) * 100)}%`
                    : '2%',
                  transition: 'width var(--t) var(--ease)',
                }}
              />
            </div>
          </div>
          <div className="ladder__x">{reveal ? `${r.bytes} B` : '—'}</div>
        </div>
      ))}
    </div>
  );
}
