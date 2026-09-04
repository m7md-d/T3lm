/**
 * تصريف القسم إلى كتل — **مفردات هذا المنهج كما يفرضها
 * `../../../tools/verify.py`**. ما يقرؤه الفاحص يقرؤه الموقع، فلا يفترق
 * ما يُعرَض عمّا يُتحقَّق منه.
 *
 *   <!-- part: NAME -->   مقتطع، وبرنامجه الكامل `programs/NAME.py`
 *   <!-- head: FILE -->   مقتطعٌ من ملفٍّ في `programs/` — يُفحَص سطراً سطراً
 *   <!-- part -->         مقتطعٌ بلا ملفّ
 *   <!-- task -->         كودُ تمرينٍ يكتبه القارئ — ليس ادّعاءً
 *   <!-- out --> · out: س  لوحةُ مخرَجٍ حتميّ للبرنامج الذي قبلها
 *   <!-- err: NAME -->     لوحةٌ تنتهي برفضٍ من الأداة
 *   <!-- runs: NAME -->    لوحةٌ أرقامُها تختلف بين تشغيلين — النسبة هي الثابت
 *   <!-- shell -->         مخرَجُ أوامرِ صدفة
 *   المخرَج:               سؤالُ توقّعٍ يقفل المخرَج الذي بعده
 */
import { html } from '../lib/md';
import type { Block, PanelKind } from '../lib/types';

const MARK = /^<!--\s*([a-z-]+)(?::\s*(.*?))?\s*-->$/;
const GATE = /^المخرَج\s*:\s*$/;
const FENCE = /^```([\w.+-]*)\s*$/;
const PANELS = new Set<PanelKind>(['out', 'err', 'runs', 'shell']);

export function compileShot(md: string): Block[] {
  const lines = md.split('\n');
  const out: Block[] = [];
  let prose: string[] = [];
  let pending: { kind: string; arg?: string } | null = null;

  const flush = () => {
    const s = prose.join('\n').trim();
    if (s) out.push({ t: 'prose', html: html(s) });
    prose = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]!;
    const t = ln.trim();

    if (GATE.test(t)) { flush(); out.push({ t: 'gate' }); continue; }

    const m = MARK.exec(t);
    if (m) { flush(); pending = { kind: m[1]!, arg: m[2] || undefined }; continue; }

    const f = FENCE.exec(t);
    if (f) {
      const body: string[] = [];
      let k = i + 1;
      for (; k < lines.length && !/^```\s*$/.test(lines[k]!.trim()); k++) body.push(lines[k]!);
      i = k;
      flush();
      const code = body.join('\n');
      const kind = pending?.kind;

      if (kind && PANELS.has(kind as PanelKind)) {
        out.push({
          t: 'panel',
          kind: kind as PanelKind,
          text: code,
          note: kind === 'out' || kind === 'shell' ? pending?.arg : undefined,
          arg: kind === 'err' || kind === 'runs' ? pending?.arg : undefined,
        });
      } else {
        out.push({
          t: 'code',
          lang: f[1] ?? '',
          code,
          file: kind === 'part' ? pending?.arg : undefined,
          from: kind === 'head' ? pending?.arg : undefined,
          task: kind === 'task' || undefined,
        });
      }
      pending = null;
      continue;
    }

    prose.push(ln);
  }
  flush();
  return out;
}
