/**
 * لحظةُ التفاعل الواحدة على الواجهة — تقلب: «البكسلُ مربّعٌ صغيرٌ يُضاء أو
 * يُطفأ».
 *
 * حافّةٌ رأسيةٌ يحرّكها القارئ، وثمانِ خلايا تعرض **نصيبَها من المساحة**. وهو
 * تعريفُ التغطية نفسُه الذي يثبته الإقليم `00` بمقطعٍ يعمل: مجموعُ الصفّ يساوي
 * المساحة الهندسية بالضبط — وهو معروضٌ هنا تحت الشريط.
 */
import { useState } from 'react';

const N = 8;

export function EdgeStrip() {
  const [x, setX] = useState(4.35);
  const cells = Array.from({ length: N }, (_, i) => Math.min(1, Math.max(0, x - i)));
  const sum = cells.reduce((a, b) => a + b, 0);

  return (
    <div className="edge">
      <div className="edge__cells" aria-hidden>
        {cells.map((c, i) => (
          <i key={i} style={{ opacity: c }} />
        ))}
      </div>
      <div className="edge__nums" aria-hidden>
        {cells.map((c, i) => (
          <span key={i} className="en">{c.toFixed(2)}</span>
        ))}
      </div>
      <label className="edge__ctl">
        <span className="ctl__label">موضعُ الحافّة</span>
        <input
          type="range" min={0} max={N} step={0.01} value={x}
          onChange={(e) => setX(Number(e.target.value))}
          aria-label="موضع الحافّة على الشريط"
        />
        <span className="edge__read">
          الحافّة عند <b className="en">{x.toFixed(2)}</b> ·
          مجموعُ التغطية <b className="en">{sum.toFixed(2)}</b>
        </span>
      </label>
    </div>
  );
}
