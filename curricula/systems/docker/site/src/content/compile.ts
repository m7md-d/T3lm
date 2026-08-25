/**
 * تصريف اللقطة إلى بلوكات — مفردات هذا المنهج كما يكتبها المؤلّف ويفرضها
 * `../../tools/verify.py`. **الملفّ واحد**: ما يقرؤه الفاحص يقرؤه الموقع، فلا
 * يفترق ما يُعرَض عمّا يُتحقَّق منه.
 *
 *   `<!-- lab -->` · `<!-- host -->`          أمرٌ يُشغَّل، وموضعه
 *   `<!-- setup -->` · `<!-- host-setup -->`  تهيئةٌ بلا لوحة
 *   `<!-- gate -->` · `<!-- out -->` · `<!-- runs -->`   لوحة الأمر الذي قبلها
 *   `<!-- part: NAME -->`                     مقتطفٌ من `programs/NAME`
 *   `@oci @impl @distro @vm @machine`         السلطة، وبلا وسمٍ نواة
 *   `#! rc:` · `#! head:` · `#! tail:` · `#! sort`   توجيهاتٌ **لا تصل القارئ**
 *   `> **توقّع…`                              بوّابةٌ تقفل اللوحة التي تليها
 */
import { html } from '../lib/md';
import type { AnyBlock, AuthorityTag, PanelBlock, RunSite } from '../lib/types';

const MARK = /^<!--\s*(part:\s*[^\s>]+|[a-z-]+)(?:\s+(@[a-z]+))?\s*-->$/;
const FENCE = /^```([\w.+-]*)\s*$/;
const DIRECTIVE = /^#!\s/;
const PREDICT = /^>\s*\*\*توقّع/;

type Kind = 'lab' | 'host' | 'setup' | 'host-setup' | 'gate' | 'out' | 'runs' | 'part';

interface Piece { kind: Kind; arg?: string; tag?: AuthorityTag; lang: string; body: string }

/** يفصل الملفّ إلى نصٍّ حرّ وقطعٍ موسومة، بترتيبها. */
function scan(raw: string): (string | Piece)[] {
  const lines = raw.split('\n');
  const out: (string | Piece)[] = [];
  let prose: string[] = [];
  const flush = () => { if (prose.join('\n').trim()) out.push(prose.join('\n')); prose = []; };

  for (let i = 0; i < lines.length; i++) {
    const m = MARK.exec(lines[i]!.trim());
    if (!m) { prose.push(lines[i]!); continue; }

    /* التعليق وسمٌ، وما يليه سياجُ كودٍ يخصّه */
    let j = i + 1;
    while (j < lines.length && lines[j]!.trim() === '') j++;
    const f = FENCE.exec(lines[j]?.trim() ?? '');
    if (!f) { prose.push(lines[i]!); continue; }

    const body: string[] = [];
    let k = j + 1;
    for (; k < lines.length && !/^```\s*$/.test(lines[k]!.trim()); k++) body.push(lines[k]!);

    const head = m[1]!;
    const kind = (head.startsWith('part:') ? 'part' : head) as Kind;
    flush();
    out.push({
      kind,
      arg: head.startsWith('part:') ? head.slice(5).trim() : undefined,
      tag: m[2] as AuthorityTag | undefined,
      lang: f[1] || 'sh',
      body: body.join('\n'),
    });
    i = k;
  }
  flush();
  return out;
}

const isCmd = (k: Kind) => k === 'lab' || k === 'host' || k === 'setup' || k === 'host-setup';
const isPanel = (k: Kind) => k === 'gate' || k === 'out' || k === 'runs';
const siteOf = (k: Kind): RunSite => (k === 'lab' || k === 'setup' ? 'lab' : 'host');

/** التوجيهات تعليماتٌ للفاحص، فلا تُعرَض. */
const strip = (s: string) => s.split('\n').filter((l) => !DIRECTIVE.test(l)).join('\n').replace(/\n+$/, '');

/** «توقّع…» في آخر فقرةٍ قبل اللوحة ⇒ بوّابة. تُنتزَع من النثر ولا تُكرَّر. */
function splitPredict(md: string): { rest: string; ask?: string } {
  const lines = md.split('\n');
  let start = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (PREDICT.test(lines[i]!)) { start = i; break; }
    if (lines[i]!.trim() !== '' && !lines[i]!.startsWith('>')) break;
  }
  if (start < 0) return { rest: md };
  return {
    rest: lines.slice(0, start).join('\n'),
    ask: lines.slice(start).map((l) => l.replace(/^>\s?/, '')).join('\n'),
  };
}

export function compileShot(raw: string, key: string): AnyBlock[] {
  const pieces = scan(raw);
  const out: AnyBlock[] = [];
  let pending: Piece | null = null;
  let gates = 0;

  const dropPending = () => {
    if (!pending) return;
    out.push({ kind: 'code', lang: pending.lang, code: strip(pending.body) });
    pending = null;
  };

  for (const p of pieces) {
    if (typeof p === 'string') {
      dropPending();
      const { rest, ask } = splitPredict(p);
      if (rest.trim()) out.push({ kind: 'prose', html: html(rest) });
      if (ask) out.push({ kind: 'gate', id: `${key}:${gates++}`, askHtml: html(ask) });
      continue;
    }

    if (p.kind === 'part') {
      dropPending();
      out.push({ kind: 'part', program: p.arg ?? '', code: strip(p.body), lang: p.lang });
      continue;
    }

    if (isCmd(p.kind)) { dropPending(); pending = p; continue; }

    if (isPanel(p.kind)) {
      const cmd = pending;
      pending = null;
      const panel: PanelBlock = {
        kind: 'panel',
        role: p.kind as PanelBlock['role'],
        site: cmd ? siteOf(cmd.kind) : 'lab',
        tag: p.tag ?? cmd?.tag ?? '@kernel',
        command: cmd ? strip(cmd.body) : '',
        output: strip(p.body),
      };
      out.push(panel);
      continue;
    }
  }
  dropPending();
  return out;
}
