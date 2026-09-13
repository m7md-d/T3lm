import type { Trace as T } from '../lib/types';

/**
 * مسار التنفيذ — سُلَّمُ خطوات لا `pre`.
 *
 * تسعةُ بلوكاتٍ في المنهج تفصل خطواتِها `↓`، وتخلط السهم بنصٍّ عربيّ. و`pre`
 * باتجاه LTR يقلبها، فتُقرأ الخطوة من آخرها. فتُصرَّف صفوفاً: الرقم أحاديّ
 * معزول، والنصّ عربيٌّ في اتجاهه.
 */
export function Trace({ t }: { t: T }) {
  return (
    <ol className="trace">
      {t.steps.map((s, i) => (
        <li className="trace-s" key={i}>
          <span className="trace-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          <span dangerouslySetInnerHTML={{ __html: s.html }} />
        </li>
      ))}
    </ol>
  );
}
