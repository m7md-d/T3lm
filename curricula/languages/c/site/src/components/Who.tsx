import { AUTH, AUTH_ORDER } from '../lib/structure';
import type { Auth } from '../lib/structure';

/**
 * «من قرّر؟» — عمودٌ ملاصقٌ للّقطة يقول من يضمن مخرَجاتها.
 *
 * هو السؤال الرابع من أسئلة الفصل صفر الأربعة، وهو الوحيد فيها الذي يُقرأ من
 * الماركداون آلياً: ١١١ لوحةً تحمل سلطتها في علامتها. والثلاثة الأخرى — كم
 * بايتاً، وبأي ترتيب، وكيف تُفسَّر — يجيب عنها متن اللقطة نفسه، فلا تُكرَّر هنا
 * حقلاً ثابتاً لا يفرّق بين لقطةٍ وأخرى.
 *
 * وملاصقتُه للّقطة لا وضعُه في قائمةٍ تحتها **شرط** لا ذوق: التقارب المكاني
 * (d ≈ 0.80). ولقطةٌ كل لوحاتها من المواصفة لا تحمل عموداً — الصمت هو الحال
 * الطبيعية، والعمود يظهر حين يكون هناك ما يُقال.
 */
export function Who({ auths }: { auths: Auth[] }) {
  const worth = auths.filter((a) => a !== 'spec');
  if (!worth.length) return null;

  return (
    <aside className="who" aria-label="من يضمن مخرَجات هذه اللقطة">
      <h4 className="who-q">من قرّر؟</h4>
      <ul className="who-list">
        {AUTH_ORDER.filter((a) => auths.includes(a)).map((a) => (
          <li key={a} className="who-row" data-family={AUTH[a].family}>
            <b>{AUTH[a].word}</b>
            <span>{AUTH[a].says}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** حصادُ السلطات عبر المنهج كلّه، أو عبر إقليمٍ واحد — شريطٌ بنِسَبٍ حقيقية. */
export function Spread({ counts, total }: { counts: Record<Auth, number>; total: number }) {
  const shown = AUTH_ORDER.filter((a) => counts[a] > 0);
  return (
    <div className="spread">
      <div className="spread-bar">
        {shown.map((a) => (
          <span
            key={a} data-family={AUTH[a].family}
            style={{ flexGrow: counts[a] }}
            title={`${AUTH[a].word} — ${counts[a]} لوحة`}
          />
        ))}
      </div>
      <ul className="spread-key">
        {shown.map((a) => (
          <li key={a} data-family={AUTH[a].family}>
            <b>{AUTH[a].word}</b>
            <span className="en">{counts[a]}</span>
          </li>
        ))}
      </ul>
      <p className="spread-note">
        {total} لوحةً في المنهج، كلُّها شُغِّلت وقُورن مخرَجها بما هو مكتوبٌ هنا.
      </p>
    </div>
  );
}
