/**
 * خريطة المصادر — الادّعاء المركزيّ في المنهج يصير شيئاً يُقلَب بيد القارئ:
 * «ولا يلزم أن يملك الادّعاء مصدراً واحداً … ولا تذوب المصادر في جملةٍ واحدة».
 *
 * سبعةٌ وعشرون عموداً في خمسة صفوف، والعدد من `regions/` لا من الكود.
 * والتفاعل غير المقفل بلا سقفٍ عدديّ (أدلّة §٤)، وله سببٌ هنا: تتبّعُ علاقة.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FAMILIES, FAMILY_NAME } from '../lib/authority';
import { chapters } from '../content/regions';
import { packs } from '../content/plan';
import type { Family } from '../lib/types';

const census = chapters.map((c) => {
  const by: Record<string, number> = {};
  for (const p of c.panels) by[p.family ?? 'manual'] = (by[p.family ?? 'manual'] ?? 0) + 1;
  return { num: c.num, title: c.title, by };
});

const totals: Record<string, number> = {};
for (const c of census) for (const k of Object.keys(c.by)) totals[k] = (totals[k] ?? 0) + c.by[k]!;

export function SourceMap() {
  const [on, setOn] = useState<Family | null>(null);

  return (
    <div className={`smap${on ? ' is-filtered' : ''}`}>
      <div className="smap-keys">
        {FAMILIES.map((f) => (
          <button
            key={f}
            className={`skey skey-${f}${on === f ? ' is-on' : ''}`}
            aria-pressed={on === f}
            onClick={() => setOn(on === f ? null : f)}
          >
            <span className="skey-dot" aria-hidden="true" />
            <span className="skey-name">{FAMILY_NAME[f]}</span>
            <span className="skey-n en">{totals[f] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="smap-grid" role="group" aria-label="لوحات كل فصل ومن يضمنها">
        {census.map((c) => (
          <Link key={c.num} className="scol" to={`/f/${c.num}`} title={c.title}>
            <span className="scol-stack">
              {FAMILIES.map((f) =>
                Array.from({ length: c.by[f] ?? 0 }, (_, i) => (
                  <span
                    key={`${f}${i}`}
                    className={`scell scell-${f}${on && on !== f ? ' is-off' : ''}`}
                  />
                )),
              )}
              {Array.from({ length: c.by['manual'] ?? 0 }, (_, i) => (
                <span key={`m${i}`} className={`scell scell-manual${on ? ' is-off' : ''}`} />
              ))}
            </span>
            <span className="scol-n en">{c.num}</span>
          </Link>
        ))}
      </div>

      <div className="smap-packs" aria-hidden="true">
        {packs.map((p) => (
          <span key={p.range} className="spack" style={{ flexGrow: p.to - p.from + 1 }}>
            {p.title}
          </span>
        ))}
      </div>
    </div>
  );
}
