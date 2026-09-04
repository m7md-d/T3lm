/**
 * تصريف القسم إلى كتل — **مفردات هذا المنهج كما يفرضها
 * `../../../tools/verify.py`**. ما يقرؤه الفاحص يقرؤه الموقع، فلا يفترق ما
 * يُعرَض عمّا يُتحقَّق منه.
 *
 *   <!-- part: NAME -->   مقتطع، وبرنامجه الكامل `programs/NAME.py`
 *   <!-- head: PATH -->   مقتطعٌ من ملفٍّ في المنهج — يُفحَص سطراً سطراً
 *   <!-- out --> · out: س  مخرَجُ البرنامج الذي قبله
 *   <!-- err: NAME -->    البرنامج يفشل، والكتلة رسالتُه كما تخرج
 *   <!-- runs: NAME -->   أرقامٌ تختلف بين تشغيلين
 *   <!-- file: PATH -->   نصُّ ملفٍّ في المنهج، يُطابَق حرفياً
 *   <!-- suite -->        مخرَجُ حزمتَي الأمثلة
 *   <!-- spec -->         اقتباسٌ من مواصفة
 *   <!-- math --> · diagram   صيغةٌ مكتوبة أو مخطّطٌ مرسوم
 *   <!-- task -->         كودُ تمرينٍ يكتبه القارئ
 *   المخرَج:              سؤالُ توقّعٍ يقفل ما بعده
 */
import { html } from '../lib/md';
import type { Block, PanelKind } from '../lib/types';

const MARK = /^<!--\s*([a-z-]+)(?::\s*(.*?))?\s*-->$/;
const GATE = /^المخرَج\s*:\s*$/;
const FENCE = /^```([\w.+-]*)\s*$/;
const PANELS = new Set<PanelKind>(['out', 'err', 'runs', 'shell', 'suite', 'file', 'spec', 'math', 'diagram']);

export function compileShot(md: string): Block[] {
  const lines = md.split('\n');
  const out: Block[] = [];
  let prose: string[] = [];
  let pending: { kind: string; arg?: string } | null = null;
  let label: string | undefined;

  /* الوسمُ البنيويّ المفرد — `**مثال**` و`**المخرَج**` — ترويسةٌ لا فقرة:
     الماركداون يحتاجه سطراً يمسحه القارئ، والموقع يعرضه في رأس الكتلة. وعرضُه
     مرّتين تكرارٌ يقرؤه القارئ عيباً. */
  const flush = () => {
    const s = prose.join('\n').trim();
    prose = [];
    if (!s) return;
    const lone = /^\*\*([^*\n]+)\*\*$/.exec(s);
    if (lone) { label = lone[1]!.replace(/:$/, ''); return; }
    out.push({ t: 'prose', html: html(s) });
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
          arg: kind === 'err' || kind === 'runs' || kind === 'file' ? pending?.arg : undefined,
          label,
        });
      } else {
        out.push({
          t: 'code',
          lang: f[1] ?? '',
          code,
          file: kind === 'part' ? pending?.arg : undefined,
          from: kind === 'head' ? pending?.arg : undefined,
          task: kind === 'task' || undefined,
          label,
        });
      }
      pending = null;
      label = undefined;
      continue;
    }

    prose.push(ln);
  }
  flush();
  return out;
}

/** وسمُ الكتلة: قناةٌ نصّيةٌ واحدةٌ مع اللون، ولا ثالثة. */
export const TAG: Record<PanelKind, string> = {
  out: 'المخرَج',
  err: 'انهيارٌ في كودك',
  runs: 'يختلف بين تشغيلين',
  shell: 'صدفة',
  suite: 'حزمتا الأمثلة',
  file: 'ملفٌّ في المنهج',
  spec: 'نصُّ المواصفة',
  math: 'الصيغة',
  diagram: 'مخطّط',
};
