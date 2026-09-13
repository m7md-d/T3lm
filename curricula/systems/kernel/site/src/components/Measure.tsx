import { useState } from 'react';
import type { Panel } from '../lib/types';
import { TAG_TEXT, familyOf } from '../lib/authority';

/**
 * قياسُ الفصل `00` — ثلاثة تشغيلاتٍ يبدّل بينها القارئ.
 *
 * وهو أوّل ما في المنهج، **ولا يحتاج مصطلحاً واحداً من مصطلحات النواة**: برنامجٌ
 * يحسب، ثم يكتب مئتي ألف بايتٍ بايتاً بايتاً، ثم يكتبها دفعةً واحدة. فيصلح
 * لحظةَ تفاعلٍ على الواجهة لمن لم يبدأ بعد.
 *
 * والأرقام تُنتزَع من لوحة الفصل نفسها — لا تُكتب هنا (الثابت ٤).
 */
const ROW = /^(\w+)\s+(.*?)\s{2,}real\s+([\d.]+)\s+user\s+([\d.]+)\s+sys\s+([\d.]+)\s*$/;
const CMD = /^\$\s+(.+)$/;

interface Run { name: string; what: string; cmd: string; real: number; user: number; sys: number }

export function readRuns(p: Panel): Run[] {
  const lines = p.text.split('\n');
  const out: Run[] = [];
  let cmd = '';
  for (const l of lines) {
    const c = l.match(CMD);
    if (c) { cmd = c[1]!; continue; }
    const m = l.match(ROW);
    if (m) out.push({ name: m[1]!, what: m[2]!.trim(), cmd, real: +m[3]!, user: +m[4]!, sys: +m[5]! });
  }
  return out;
}

export function Measure({ panel, sayHtml }: { panel: Panel; sayHtml: string | null }) {
  const runs = readRuns(panel);
  const [at, setAt] = useState(0);
  if (!runs.length) return null;
  const top = Math.max(...runs.map((r) => r.real)) || 1;
  const r = runs[Math.min(at, runs.length - 1)]!;
  const fam = familyOf(panel.tag);

  return (
    <div className="meas">
      <div className="meas-tabs">
        {runs.map((x, i) => (
          <button key={x.name} type="button" className="meas-b" aria-pressed={i === at} onClick={() => setAt(i)}>
            <span className="en">{x.name}</span>
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <span className="tag" data-fam={fam}>{TAG_TEXT[panel.tag]}</span>
      </div>
      <div className="meas-body">
        <div className="code-file" style={{ fontSize: '0.8rem' }}>$ {r.cmd}</div>
        <div className="meas-say" style={{ marginBottom: '0.8em' }}>
          <span className="en">{r.what}</span>
        </div>
        <div className="bars">
          {(['real', 'user', 'sys'] as const).map((k) => (
            <div className="bar-row" key={k}>
              <span className="bar-k">{k}</span>
              <span className="bar-t"><i data-w={k} style={{ width: `${Math.max((r[k] / top) * 100, 1.2)}%` }} /></span>
              <span className="bar-v">{r[k].toFixed(2)}s</span>
            </div>
          ))}
        </div>
      </div>
      {sayHtml && <div className="panel-note prose" style={{ padding: '0 1em 1em' }} dangerouslySetInnerHTML={{ __html: sayHtml }} />}
    </div>
  );
}
