import { useEffect, useRef } from 'react';
import type { Shot } from '../lib/types';

/**
 * شريط المراحل.
 *
 * الأسلوب `kernel-dfs` §٤ يعلن قالباً من اثنتي عشرة مرحلة بترتيبٍ ثابت، وهو
 * مكتوبٌ في الماركداون عناوينَ `## `. فالقارئ يتعلّم مكاناً واحداً ويستعمله
 * في سبعةٍ وعشرين فصلاً — وهذا وحده جوابُ «أين أنا» بلا عدٍّ ولا نسبة.
 */
export function Rail({ shots, at, furthest, go }: {
  shots: Shot[]; at: number; furthest: number; go: (i: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);

  /*
   * التمرير يدويّ داخل الشريط وحده. و`scrollIntoView` تمرّر كلَّ أصلٍ قابلٍ
   * للتمرير ومنه الصفحة نفسها — فتُزيح المتن أفقياً في RTL.
   */
  useEffect(() => {
    const wrap = box.current;
    const el = wrap?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!wrap || !el) return;
    wrap.scrollLeft = el.offsetLeft - (wrap.clientWidth - el.clientWidth) / 2;
  }, [at]);

  return (
    <nav className="rail" ref={box} aria-label="مراحل الفصل">
      {shots.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className="rail-item"
          aria-current={i === at ? 'true' : 'false'}
          data-seen={i <= furthest ? '1' : '0'}
          onClick={() => go(i)}
        >
          {s.stage ?? s.title}
        </button>
      ))}
    </nav>
  );
}
