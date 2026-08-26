/**
 * تصريف اللقطة إلى بلوكات — **مفردات هذا المنهج كما يكتبها المؤلّف ويفرضها
 * `../../../tools/verify.py`**. والمفردات واحدة: ما يقرؤه الفاحص يقرؤه الموقع،
 * فلا يفترق ما يُعرَض عمّا يُتحقَّق منه.
 *
 *   ```dart``` بلا علامة        برنامجٌ كامل — يُحفَظ `main.dart` ويُشغَّل
 *   <!-- part -->               مقتطعٌ لا يعمل وحده…
 *   <!-- part --> + سياجٌ بلا لغة  …أو **رسمٌ** (١٨ منها: تخطيطُ بتاتٍ وذاكرة)
 *   <!-- part: NAME -->         والملفّ الكامل `programs/NAME.dart`
 *   <!-- out|err|web|web-err|aot|aot-err|c|runs -->   لوحةُ البرنامج الذي قبلها
 *   <!-- shell --> · <!-- shell: DIR -->              أوامرٌ، وسطرُ الأمر `$ `
 *   **المخرَج**:                بوّابةُ تنبّؤ تقفل اللوحة التي بعدها
 *
 * وبرنامجٌ تلته **لوحتان** ادّعاءٌ واحدٌ بجوابين: البرنامج نفسه، آلتان
 * (الإقليم ٠٢ «وعلى الويب ليست كذلك»).
 */
import { html } from '../lib/md';
import { commandOf, machineOf, verdictOf } from '../lib/machine';
import type { AnyBlock, Mark, Panel, Program, RunBlock, Step } from '../lib/types';

const MARK = /^<!--\s*([a-z-]+)(?::\s*([^\s>]+))?\s*-->$/;
const GATE = /^\*{0,2}المخرَج\*{0,2}\s*:\s*$/;
const FENCE = /^```([\w.+-]*)\s*$/;
const PREDICT = /توقّع|تنبّأ/;

const PANEL_MARKS = new Set<Mark>([
  'out', 'err', 'web', 'web-err', 'aot', 'aot-err', 'c', 'runs', 'shell',
]);

type Tok =
  | { t: 'text'; s: string }
  | { t: 'gate' }
  | { t: 'mark'; kind: string; arg?: string }
  | { t: 'fence'; lang: string; body: string };

function scan(raw: string): Tok[] {
  const lines = raw.split('\n');
  const out: Tok[] = [];
  let prose: string[] = [];
  const flush = () => { if (prose.join('\n').trim()) out.push({ t: 'text', s: prose.join('\n') }); prose = []; };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]!;
    const t = ln.trim();

    if (GATE.test(t)) { flush(); out.push({ t: 'gate' }); continue; }

    const m = MARK.exec(t);
    if (m) { flush(); out.push({ t: 'mark', kind: m[1]!, arg: m[2] }); continue; }

    const f = FENCE.exec(t);
    if (f) {
      const body: string[] = [];
      let k = i + 1;
      for (; k < lines.length && !/^```\s*$/.test(lines[k]!.trim()); k++) body.push(lines[k]!);
      flush();
      out.push({ t: 'fence', lang: f[1] ?? '', body: body.join('\n') });
      i = k;
      continue;
    }
    prose.push(ln);
  }
  flush();
  return out;
}

/** `$ أمر` ثم ما تحته حتى الأمر التالي. */
function steps(body: string): Step[] {
  const out: Step[] = [];
  let cur: Step | null = null;
  for (const row of body.split('\n')) {
    if (row.startsWith('$ ')) { cur = { cmd: row.slice(2).trim(), out: '' }; out.push(cur); }
    else if (cur) cur.out += (cur.out ? '\n' : '') + row;
  }
  return out.map((s) => ({ ...s, out: s.out.replace(/\n+$/, '') }));
}

export function compileShot(raw: string, key: string): AnyBlock[] {
  const toks = scan(raw);
  const out: AnyBlock[] = [];

  let run: RunBlock | null = null;
  let mark: { kind: string; arg?: string } | null = null;
  let gated = false;
  let ask = '';        /* آخر فقرةٍ فيها «توقّع» — نصُّ البوّابة */
  let gates = 0;

  const flushRun = () => { if (run) { out.push(run); run = null; } };
  const startRun = (program?: Program) => { flushRun(); run = { kind: 'run', program, panels: [] }; };

  for (const tk of toks) {
    if (tk.t === 'text') {
      flushRun();
      if (PREDICT.test(tk.s)) ask = tk.s;
      out.push({ kind: 'prose', html: html(tk.s) });
      continue;
    }
    if (tk.t === 'gate') { gated = true; continue; }
    if (tk.t === 'mark') { mark = { kind: tk.kind, arg: tk.arg }; continue; }

    /* سياج */
    const isPanel = gated || (mark !== null && PANEL_MARKS.has(mark.kind as Mark));

    if (isPanel) {
      const kind = (gated ? 'out' : mark!.kind) as Mark;
      const sh = kind === 'shell' ? steps(tk.body) : undefined;
      const panel: Panel = {
        mark: kind,
        verdict: verdictOf(kind),
        machine: machineOf(kind),
        command: sh?.length ? '' : commandOf(kind),
        output: tk.body.replace(/\n+$/, ''),
        volatile: kind === 'runs',
        ...(sh?.length ? { steps: sh } : {}),
        ...(kind === 'shell' && mark?.arg ? { dir: mark.arg } : {}),
        ...(gated ? { gate: { id: `${key}:${gates++}`, askHtml: html(ask) } } : {}),
      };
      if (!run) run = { kind: 'run', panels: [] };
      run.panels.push(panel);
      mark = null; gated = false;
      continue;
    }

    /* ليست لوحة ⇒ برنامجٌ أو رسم */
    const named = mark && (mark.kind === 'part' || mark.kind === 'runs') ? mark.arg : undefined;
    const marked = mark !== null && (mark.kind === 'part' || mark.kind === 'runs');
    mark = null;

    if (marked && !tk.lang) { flushRun(); out.push({ kind: 'figure', text: tk.body.replace(/\n+$/, '') }); continue; }

    startRun({
      lang: tk.lang || 'text',
      code: tk.body.replace(/\n+$/, ''),
      ...(named ? { file: named } : {}),
      excerpt: marked,
    });
  }
  flushRun();
  return fold(out);
}

/**
 * تشغيلان متجاوران بآلتين مختلفتين ⇒ **جوابان لسؤالٍ واحد**، يُعرضان متقابلين.
 * وهي حال المقارنة بـC: `dart` ولوحتُه، ثم `c` ولوحتُه، بلا نثرٍ بينهما.
 */
function fold(blocks: AnyBlock[]): AnyBlock[] {
  const out: AnyBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i]!;
    const b = blocks[i + 1];
    if (
      a.kind === 'run' && b?.kind === 'run' &&
      a.panels.length === 1 && b.panels.length === 1 &&
      a.panels[0]!.machine !== b.panels[0]!.machine
    ) {
      out.push({ kind: 'facets', runs: [a, b] });
      i++;
      continue;
    }
    out.push(a);
  }
  return out;
}
