/**
 * تصريف القسم إلى بلوكات — **بمفردات `../../tools/verify.py` نفسها.**
 * ما يقرؤه الفاحص يقرؤه الموقع، فلا يفترق ما يُعرَض عمّا يُتحقَّق منه.
 *
 *   `<!-- part: NAME -->`   البلوك التالي مقتطع، وبرنامجه `programs/NAME`
 *   `<!-- runs: NAME -->`   مثلها، وأرقام اللوحة تختلف بين تشغيلين
 *   `<!-- out @tag: … -->`  اللوحة التالية مخرَجُ آخر برنامجٍ قبلها
 *   `<!-- gate @tag: … -->` مثلها، **وتُقفَل حتى يكتب القارئ توقّعه**
 *   `<!-- err -->` `<!-- warn -->`   رفضُ المترجم وتحذيره
 *   `<!-- shell -->`        من خارج الحاوية — يدويةٌ مُعلَنة
 *
 * و«توقّع…» في أوّل آخر فقرةٍ قبل اللوحة تفعل ما يفعله `gate`: المتن يأمر
 * القارئ بالتوقّع، والموقع ينفّذ الأمر.
 */
import { familyOf } from '../lib/authority';
import { gradeOf } from '../lib/grade';
import { html } from '../lib/md';
import type { Bind, Block, PanelBlock, Tag } from '../lib/types';

const BIND = /^<!--\s*(part|runs)(?:\s*@\w+)?(?::\s*([\w./-]+))?\s*-->$/;
const PANEL = /^<!--\s*(out|gate|err|warn)(?:\s*@(\w+))?(?::\s*(.*?))?\s*-->$/;
const SHELL = /^<!--\s*shell\s*-->$/;
const FENCE = /^```([\w.+-]*)\s*$/;

/** وسمٌ بنيويّ يتكرّر بلا تنويع (الأسلوب §٤)، واللوحة تعرضه بنفسها. */
const LABEL = /^\*\*(?:المخرَج|البرنامج)\*\*\s*:?\s*$|^\*\*المخرَج:\*\*\s*$/;

/** «توقّع…» في **أوّل** الفقرة. وما جاء في وسطها إحالةٌ إلى رقمٍ مضى لا بوّابة. */
const PREDICT = /^\*{0,2}توقّع/;

type Piece =
  | { t: 'prose'; md: string }
  | { t: 'code'; lang: string; code: string; bind: Bind; program: string | null }
  | { t: 'panel'; role: 'out' | 'gate' | 'err' | 'warn' | 'shell'; tag: Tag | null; note: string; output: string };

/** يفصل الملفّ إلى نثرٍ وقطعٍ موسومة، بترتيبها. */
function scan(raw: string): Piece[] {
  const lines = raw.split('\n');
  const out: Piece[] = [];
  let prose: string[] = [];
  const flush = () => {
    const md = prose.filter((l) => !LABEL.test(l.trim())).join('\n');
    if (md.trim()) out.push({ t: 'prose', md });
    prose = [];
  };

  let pendingBind: { bind: Bind; program: string | null } | null = null;
  type Role = 'out' | 'gate' | 'err' | 'warn' | 'shell';
  let pendingPanel: { role: Role; tag: Tag | null; note: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i]!.trim();

    const b = BIND.exec(t);
    if (b) { flush(); pendingBind = { bind: b[1] as Bind, program: b[2] ?? null }; continue; }

    const p = PANEL.exec(t);
    if (p) {
      pendingPanel = { role: p[1] as Role, tag: (p[2] ?? 'spec') as Tag, note: (p[3] ?? '').trim() };
      continue;
    }
    if (SHELL.test(t)) { pendingPanel = { role: 'shell', tag: null, note: '' }; continue; }

    const f = FENCE.exec(t);
    if (!f) { prose.push(lines[i]!); continue; }

    const body: string[] = [];
    let k = i + 1;
    for (; k < lines.length && !/^```\s*$/.test(lines[k]!.trim()); k++) body.push(lines[k]!);
    const code = body.join('\n').replace(/\n+$/, '');
    i = k;

    if (pendingPanel) {
      flush();
      out.push({ t: 'panel', role: pendingPanel.role, tag: pendingPanel.tag, note: pendingPanel.note, output: code });
      pendingPanel = null;
      pendingBind = null;
      continue;
    }
    flush();
    out.push({ t: 'code', lang: f[1] || 'text', code, bind: pendingBind?.bind ?? null, program: pendingBind?.program ?? null });
    pendingBind = null;
  }
  flush();
  return out;
}

/**
 * ينتزع فقرة التوقّع من ذيل نثرٍ، إن كانت هناك.
 *
 * والفقرات الفارغة تُتخطّى: وسمُ `**المخرَج**` يُحذَف عند المسح فيترك سطراً
 * فارغاً بين السؤال واللوحة، ولولا تخطّيه لسقطت كلُّ بوّابةٍ تسبقها اللوحةُ
 * مباشرةً.
 */
function takePredict(md: string): { rest: string; ask: string | null } {
  const paras = md.split(/\n\s*\n/);
  let at = -1;
  for (let i = paras.length - 1; i >= 0; i--) {
    if (paras[i]!.trim() === '') continue;
    at = i;
    break;
  }
  if (at < 0 || !PREDICT.test(paras[at]!.trim())) return { rest: md, ask: null };
  return { rest: paras.slice(0, at).join('\n\n'), ask: paras[at]!.trim() };
}

export function compileShot(raw: string, key: string): Block[] {
  const pieces = scan(raw);
  const out: Block[] = [];

  let held: Extract<Piece, { t: 'code' }> | null = null;
  /* لوحةٌ بلا برنامجٍ قبلها مباشرةً تتبع **أقرب برنامجٍ سبقها** — كما يفعل
     الفاحص. ومثالُه في `01`: برنامجٌ واحد، ولوحتان: بصلاحيةٍ وبلا صلاحية. */
  let lastBind: Bind = null;
  let lastProgram: string | null = null;
  let mid: string[] = [];
  let n = 0;

  /** آخر بلوك نثرٍ صدر — قد تسكن فيه فقرةُ التوقّع حين تسبق البرنامج. */
  const pullPredictFromLast = (): string | null => {
    for (let i = out.length - 1; i >= 0; i--) {
      const b = out[i]!;
      if (b.kind !== 'prose') return null;
      if (!b.rawMd) return null;
      const { rest, ask } = takePredict(b.rawMd);
      if (!ask) return null;
      if (rest.trim()) { out[i] = { kind: 'prose', html: html(rest), rawMd: rest }; }
      else out.splice(i, 1);
      return ask;
    }
    return null;
  };

  const dropHeld = () => {
    if (held) { out.push({ kind: 'code', lang: held.lang, code: held.code }); held = null; }
    if (mid.length) { const md = mid.join('\n\n'); mid = []; if (md.trim()) out.push({ kind: 'prose', html: html(md), rawMd: md }); }
  };

  for (const p of pieces) {
    if (p.t === 'prose') {
      if (held) mid.push(p.md);
      else out.push({ kind: 'prose', html: html(p.md), rawMd: p.md });
      continue;
    }
    if (p.t === 'code') {
      dropHeld();
      held = p;
      if (p.lang === 'c') { lastBind = p.bind; lastProgram = p.program; }
      continue;
    }

    /* لوحة: تضمّ البرنامج المحجوز وما بينهما من نثر */
    const midMd = mid.join('\n\n');
    mid = [];
    const { rest, ask: midAsk } = takePredict(midMd);
    const ask = midAsk ?? (held ? pullPredictFromLast() : null);

    const tag = p.tag;
    const panel: PanelBlock = {
      kind: 'panel',
      id: `${key}:${n++}`,
      grade: gradeOf(p.role, held?.bind ?? lastBind),
      tag,
      family: tag ? familyOf(tag, p.note) : null,
      note: p.note,
      program: held?.program ?? lastProgram,
      bind: held?.bind ?? lastBind,
      lang: held?.lang ?? 'c',
      code: held?.code ?? '',
      midHtml: rest.trim() ? html(rest) : '',
      output: p.output,
      /* بوّابةٌ بلا سؤالٍ في المتن تُفشِل فحص المحتوى، ولا يُخترَع لها نصّ */
      askHtml: ask ? html(ask) : null,
    };
    held = null;
    out.push(panel);
  }
  dropHeld();
  return out;
}
