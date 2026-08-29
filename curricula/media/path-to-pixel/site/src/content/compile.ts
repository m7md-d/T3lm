/**
 * تصريف اللقطة إلى بلوكات — **مفردات هذا المنهج كما يفرضها
 * `../../../tools/verify.py`**. ما يقرؤه الفاحص يقرؤه الموقع، فلا يفترق ما
 * يُعرَض عمّا يُتحقَّق منه.
 *
 *   <!-- part: NAME -->   مقتطع، وبرنامجه الكامل `programs/NAME.c`
 *   <!-- head: FILE -->   مقتطعٌ من رأسٍ مشترك، وأسطرُه مفحوصةٌ أنها فيه
 *   <!-- task -->         كودُ تمرينٍ يكتبه القارئ — ليس ادّعاءً
 *   <!-- math -->         صيغةٌ رياضية — ليست مخرَجَ تشغيل
 *   <!-- out --> · out: س  لوحةُ مخرَجٍ حتميّ للبرنامج الذي قبلها
 *   <!-- ref: SCENE -->   **مقارنةُ صورةٍ بـSkia** — أرقامُ الفرق
 *   <!-- runs: NAME -->   لوحةٌ أرقامُها تختلف بين تشغيلين — النسبة هي الثابت
 *   <!-- err: NAME -->    لوحةٌ رفضٍ من المترجم
 *   <!-- shell -->        مخرَجُ أوامرِ صدفة
 *   المخرَج:              بوّابةُ تنبّؤ تقفل اللوحة التي بعدها
 */
import { html } from '../lib/md';
import type { Authority, Block, PanelKind } from '../lib/types';

const MARK = /^<!--\s*([a-z-]+)(?::\s*(.*?))?\s*-->$/;
const GATE = /^المخرَج\s*:\s*$/;
const FENCE = /^```([\w.+-]*)\s*$/;
const PANELS = new Set<PanelKind>(['out', 'ref', 'runs', 'err', 'shell']);

/** سطرُ «السلطة: @rule — …» في لوحة المقارنة يقول من يضمن الفرق. */
const AUTH = /^السلطة:\s*@(math|rule|precision|colorspace)\b/m;

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
        const a = AUTH.exec(code);
        out.push({
          t: 'panel',
          kind: kind as PanelKind,
          text: code,
          note: kind === 'out' || kind === 'shell' ? pending?.arg : undefined,
          arg: kind !== 'out' && kind !== 'shell' ? pending?.arg : undefined,
          authority: a ? (a[1] as Authority) : undefined,
        });
      } else if (kind === 'math') {
        out.push({ t: 'math', text: code });
      } else {
        out.push({
          t: 'code',
          lang: f[1] ?? '',
          code,
          file: kind === 'part' ? pending?.arg : undefined,
          head: kind === 'head' ? pending?.arg : undefined,
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
