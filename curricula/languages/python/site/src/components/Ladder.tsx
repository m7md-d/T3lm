/**
 * سلّمُ النسب — موتيف الموقع، ومصدرُه أن المنهج **يقيس** العملية نفسها بأربع
 * طرقٍ ويعود إلى الأرقام أربع مرّات (الأقاليم ٠١ · ١٦ · ٢٠ · ٢١).
 *
 * والصفوف تُستخرَج من لوحة الإقليم ٠١ (`../content/facts.ts`)، ولا تُكتَب هنا.
 * والمعروض **نسبٌ** لا أزمنة: الريدمي يقول إن النسبة هي الثابت، والزمن يقيسه
 * القارئ عند نفسه.
 *
 * والمقياس لوغاريتميّ لأن المدى ×١ إلى ×١٢٢: خطّيّاً يختفي الصفّان الأوّلان.
 */
import type { Rung } from '../content/facts';

export function Ladder({ rungs, reveal }: { rungs: Rung[]; reveal?: boolean }) {
  const max = Math.max(...rungs.map((r) => r.x), 2);
  return (
    <div className="ladder">
      {rungs.map((r) => (
        <div className="ladder__row" key={r.name}>
          <div>
            <div className="ladder__name">{r.name}</div>
            <div className="ladder__track">
              <i
                className="ladder__fill"
                style={{
                  width: reveal
                    ? `${Math.max(2, (Math.log10(r.x) / Math.log10(max)) * 100)}%`
                    : '2%',
                  transition: 'width var(--t) var(--ease)',
                }}
              />
            </div>
          </div>
          <div className="ladder__x">{reveal ? `×${r.x}` : '—'}</div>
        </div>
      ))}
    </div>
  );
}
