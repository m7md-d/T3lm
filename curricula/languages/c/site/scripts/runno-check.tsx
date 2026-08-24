/**
 * **زرّ التشغيل ادّعاءٌ يُفحَص** (الثابت ١).
 *
 * يجمع كل بلوكٍ عُلِّم `runnable`، ويترجمه ويشغّله بـclang في المتصفّح، ثم
 * يقارن مخرَجه بالمسجَّل في الماركداون. وما اختلف يُطبَع، ويسقط زرُّه.
 *
 * يُشغَّل في متصفّحٍ حقيقيّ: `npm run runno`.
 */
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { regions } from '../src/lib/content';
import { buildShots, markRunnable } from '../src/lib/structure';
import type { Block } from '../src/lib/structure';

interface Job { id: string; num: string; shot: string; code: string; want: string }

const jobs: Job[] = [];
for (const r of regions) {
  for (const s of buildShots(r.chapter.sections, r.num)) {
    const bs: Block[] = s.blocks;
    /* الفحص يرشّح بالسلطة وحدها — والقائمةُ المولَّدة هي ناتجُه لا مدخلُه */
    for (const b of bs) if (b.type === 'code') b.runnable = false;
    markRunnable(bs, () => true);
    for (let i = 0; i < bs.length; i++) {
      const a = bs[i]!;
      if (a.type !== 'code' || !a.runnable) continue;
      for (let j = i + 1; j < bs.length; j++) {
        const t = bs[j]!;
        if (t.type === 'code') break;
        if (t.type === 'out') { jobs.push({ id: a.id, num: r.num, shot: s.title, code: a.code, want: t.text }); break; }
        if (t.type === 'gate') { jobs.push({ id: a.id, num: r.num, shot: s.title, code: a.code, want: t.output }); break; }
      }
    }
  }
}

const norm = (t: string) => t.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').trim();

/* دفعاتٌ لأن الترجمة عملُ معالجٍ لا انتظارَ مؤقّت: المتصفّح بلا واجهة يُوقَف
   بميزانيةِ وقتٍ افتراضيّ، وهي لا تنتظر المعالج. */
const q = new URLSearchParams(location.search);
const FROM = Number(q.get('from') ?? 0);
const TO = Number(q.get('to') ?? jobs.length);
const batch = jobs.slice(FROM, TO);

function App() {
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { headlessRunCode } = await import('@runno/runtime');
      const out: string[] = [`لوحات قابلة للتشغيل: ${jobs.length} · هذه الدفعة ${FROM}‑${Math.min(TO, jobs.length)}`];
      let ok = 0, bad = 0;
      const pass: string[] = [];
      for (const j of batch) {
        try {
          const r = await headlessRunCode('clang', j.code, '');
          const got = r.resultType === 'complete'
            ? norm((r.stdout ?? '') + (r.stderr ?? ''))
            : `«${r.resultType}: ${String((r as { error?: { message?: string } }).error?.message ?? '')}»`;
          if (got === norm(j.want)) { ok++; pass.push(j.id); }
          else { bad++; out.push(`✗ ${j.num} · ${j.shot}\n   ينتظر: ${JSON.stringify(norm(j.want).slice(0, 120))}\n   يعطي : ${JSON.stringify(got.slice(0, 120))}`); }
        } catch (e) {
          bad++; out.push(`✗ ${j.num} · ${j.shot} — ${(e as Error).message}`);
        }
        setLog([...out, `… ${ok + bad}/${batch.length}`]);
      }
      out.push(`\n${batch.length} لوحة · ${ok} مطابقة · ${bad} مخالفة`);
      out.push('\n--- runnable.json ---');
      out.push(JSON.stringify(pass));
      setLog(out); setDone(true);
    })();
  }, []);

  return <pre id="OUT" data-done={done ? '1' : '0'}>{log.join('\n')}</pre>;
}

createRoot(document.getElementById('root')!).render(<App />);
