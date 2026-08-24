import { marked } from 'marked';
import type { Tokens } from 'marked';
import { slugify } from '@t3lm/kit/md';
import verified from './runnable.json';

/** بصماتُ البلوكات التي شُغِّلت في متصفّحٍ فطابقت — يولّدها `npm run runno` */
const VERIFIED = new Set<string>(verified as string[]);

/* ══ السلطة: من يضمن هذا المخرَج ══════════════════════════════════════════
   الفصل صفر يسأل عن كل قيمة: «كم بايتاً · بأي ترتيب · كيف تُفسَّر · **ومن قرّر
   ذلك — المواصفة أم المترجم؟**» والإقليم ٢٨ يعيد الأربعة امتحاناً للخروج.

   فالسؤال الرابع هو محور هذا المنهج، و١١١ لوحةً تحمل جوابه في علامتها داخل
   الماركداون. الموقع **يقرؤه ولا يخترعه**، وسلطةٌ مجهولة تُفشِل `verify.py`.
   ══════════════════════════════════════════════════════════════════════════ */

export type Auth = 'spec' | 'posix' | 'impl' | 'unspec' | 'machine' | 'ub';

export const AUTH: Record<Auth, { word: string; says: string; family: string }> = {
  spec:    { word: 'المواصفة',      says: 'يصحّ على كل مترجمٍ مطابق',             family: 'spec' },
  posix:   { word: 'POSIX',         says: 'وعدٌ مكتوب، لكن خارج مواصفة C',        family: 'spec' },
  impl:    { word: 'المترجم',       says: 'قرّره مترجمك، وقد يقرّر غيرُه غيرَه',  family: 'impl' },
  unspec:  { word: 'غير محدَّد',     says: 'يختار بلا أن يُعلن، ولا مرجعَ تسأله', family: 'local' },
  machine: { word: 'هذه الآلة',     says: 'هذا التشغيل وهذا الجهاز وحدهما',       family: 'local' },
  ub:      { word: 'غير معرَّف',     says: 'لا أحد يعد بشيء — مسجَّلٌ لا موعود',   family: 'none' },
};

export const AUTH_ORDER: Auth[] = ['spec', 'posix', 'impl', 'unspec', 'machine', 'ub'];

export type Block =
  | { type: 'md'; html: string }
  | { type: 'gate'; output: string; id: string; note?: string; auth: Auth }
  | { type: 'out'; text: string; note?: string; auth: Auth; kind: 'out' | 'err' | 'warn' }
  | { type: 'code'; code: string; lang: string; id: string; partial?: string;
      flags?: string; runnable?: boolean }
  | { type: 'local'; code: string }
  | { type: 'figure'; text: string };

const html = (t: Tokens.Generic) => marked.parser([t as never]);

/** بصمة قصيرة للنصّ (FNV-1a) — هويّة البلوك من محتواه لا من موضعه */
function digest(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

/**
 * علاماتُ المؤلّف في الماركداون. نفسها التي يفحصها `tools/verify.py` — فما
 * يُعرَض على القارئ هو **ما فُحِص**، لا وصفٌ ثانٍ له يُكتَب باليد ويتخلّف عنه.
 *
 *   <!-- out @impl: سبب -->   لوحةُ مخرَجٍ مسجَّل، وسلطتها، وسببٌ للقارئ
 *   <!-- gate @unspec -->     مثلها، ولا تُكشَف قبل أن يكتب القارئ توقّعه
 *   <!-- err -->              رفضُ المترجم       <!-- warn @impl -->  تحذيره
 *   <!-- part: NAME -->       بلوكٌ مقتطع، وبرنامجه الكامل في programs/
 */
const PANEL = /^<!--\s*(out|gate|err|warn)(?:\s*@(\w+))?(?::\s*([\s\S]*?))?\s*-->\s*$/;
const PART = /^<!--\s*(?:part|runs)(?:\s*@\w+)?(?::\s*([\w./-]+))?\s*-->\s*$/;

const authOf = (raw: string | undefined, kind: string): Auth => {
  if (raw && raw in AUTH) return raw as Auth;
  /* بلا رمزٍ فالافتراض المواصفة — وهو افتراض الفحص نفسه */
  return kind === 'warn' ? 'impl' : 'spec';
};

export function splitBlocks(md: string, keyPrefix = ''): Block[] {
  const tokens = marked.lexer(md);
  const out: Block[] = [];
  let panel: { kind: 'out' | 'gate' | 'err' | 'warn'; auth: Auth; note?: string } | null = null;
  let partial: string | undefined;
  let gate: { note?: string } | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;

    if (t.type === 'html') {
      const raw = ((t as Tokens.Generic).raw as string).trim();
      const p = raw.match(PANEL);
      if (p) {
        panel = {
          kind: p[1] as 'out' | 'gate' | 'err' | 'warn',
          auth: authOf(p[2], p[1]!),
          note: p[3] || undefined,
        };
        continue;
      }
      const q = raw.match(PART);
      if (q) { partial = q[1] || '—'; continue; }
    }

    if (t.type === 'paragraph') {
      const raw = ((t as Tokens.Generic).raw as string).trim();
      let j = i + 1;
      while (tokens[j]?.type === 'space') j++;
      /* «المخرَج:» بوّابةُ تنبّؤ — واللوحة تحتها جوابها. والفقرة يجب ألّا تحمل
         إلا الكلمة، وإلا صارت جملةٌ عادية فيها «المخرَج» بوّابةً بلا قصد. */
      const g = raw.match(/^\*{0,2}المخرَج\*{0,2}(?:\s*\(([^)]*)\))?\s*:\s*$/);
      if (tokens[j]?.type === 'code' && g) { gate = { note: g[1] || undefined }; continue; }
    }

    if (t.type === 'code') {
      const code = (t as Tokens.Code).text;
      const lang = (t as Tokens.Code).lang ?? '';

      if (panel?.kind === 'gate') {
        out.push({
          type: 'gate', output: code, id: `${keyPrefix}:${digest(code)}`,
          note: panel.note, auth: panel.auth,
        });
        panel = null;
      } else if (panel) {
        out.push({
          type: 'out', text: code, kind: panel.kind as 'out' | 'err' | 'warn',
          auth: panel.auth, note: panel.note,
        });
        panel = null;
      } else if (gate) {
        out.push({
          type: 'gate', output: code, id: `${keyPrefix}:${digest(code)}`,
          note: gate.note, auth: 'spec',
        });
        gate = null;
      } else if (lang === 'c' || lang === 'makefile') {
        /* توجيهاتُ الفحص تُنزَع من المعروض، ويبقى منها **علمُ الترجمة** وحده:
           البلوك نفسه بعلمٍ آخر يعطي جواباً آخر، وهذا ادّعاءٌ متكرّر هنا. */
        out.push({
          type: 'code', lang, id: `${keyPrefix}:${digest(code)}`, partial,
          code: code.replace(/^\/\/!.*$\n?/gm, '').trim(),
          flags: code.match(/^\/\/!\s*cc:\s*(.+)$/m)?.[1]?.trim(),
        });
        partial = undefined;
      } else if (lang === 'bash' || lang === 'sh') {
        out.push({ type: 'local', code });
        partial = undefined;
      } else {
        /* مخطّطات ASCII وجداول البايتات: نصٌّ أحاديّ المسافة بلا ادّعاء تشغيل */
        out.push({ type: 'figure', text: code });
      }
      continue;
    }

    out.push({ type: 'md', html: html(t) });
  }
  return out;
}

export interface Shot {
  title: string;
  id: string;
  raw: string;
  blocks: Block[];
  /** سلطاتُ لوحات هذه اللقطة، مرتّبةً — مادّةُ عمود «من قرّر» */
  auths: Auth[];
}

/**
 * **أين يجوز زرُّ التشغيل** — والسلطةُ هي السياسة، لا قائمةٌ تُصان بيد.
 *
 * الزرّ ادّعاء: «اضغط وسترى ما أراه». ولا يصحّ إلا حيث **تعده المواصفة**، لأن
 * مترجماً آخر على هدفٍ آخر يجب أن يعطي الجواب نفسه. وما عداه يكذب:
 *
 *   @posix    **WASI ليست POSIX**: لا `fork` ولا `exec` ولا `pipe`
 *   @impl     `long` على wasm32 أربعةُ بايتات لا ثمانية — فالتشغيل يناقض اللوحة
 *   @machine  عنوانٌ وزمنٌ وحدُّ منصّة — بلا معنًى في هدفٍ آخر
 *   @unspec   لا مرجعَ يُسأل، ولا سبب لاتّفاق البنائين
 *   @ub       لا أحد يعد بشيء، وأكثرها تقاريرُ كاشفاتٍ لا وجود لها في wasm
 *
 * ويُشترَط فوق ذلك أن يكون **برنامجاً كاملاً**: المقتطع وحده لا يُترجَم.
 *
 * **والسلطة شرطٌ لازم لا كافٍ.** الفلتر الأخير قائمةٌ مولَّدة من تشغيلٍ فعليّ
 * في متصفّح (`npm run runno`): لا يظهر الزرّ إلا على بلوكٍ **شُغِّل وطابق
 * مخرَجُه المسجَّل**. فالزرّ ادّعاءٌ مفحوص، لا ادّعاءٌ مُستنتَج.
 */
export function markRunnable(blocks: Block[], gate: (id: string) => boolean = (id) => VERIFIED.has(id)): void {
  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i]!;
    if (a.type !== 'code' || a.lang !== 'c' || a.partial) continue;
    if (!/\bmain\s*\(/.test(a.code)) continue;
    /* أعلامُ ترجمةٍ خاصّة — كاشفاتٌ أو تحسينٌ — خارج ما تعده المواصفة */
    if (a.flags) continue;

    for (let j = i + 1; j < blocks.length; j++) {
      const t = blocks[j]!;
      if (t.type === 'code') break;
      /* والرفضُ والتحذيرُ ليسا مخرَجاً يُشغَّل: أوّلهما لا يُترجَم أصلاً،
         وثانيهما نصُّ مترجمٍ بعينه. */
      if (t.type === 'gate' || (t.type === 'out' && t.kind === 'out')) {
        const auth = t.type === 'gate' ? t.auth : t.auth;
        if (auth === 'spec' && gate(a.id)) a.runnable = true;
        break;
      }
      if (t.type === 'out') break;
    }
  }
}

export function buildShots(
  sections: { title: string; id: string; raw: string }[],
  key: string,
): Shot[] {
  return sections.map((s) => {
    const blocks = splitBlocks(s.raw, `${key}:${s.id}`);
    markRunnable(blocks);
    const seen = new Set<Auth>();
    for (const b of blocks) if (b.type === 'out' || b.type === 'gate') seen.add(b.auth);
    return {
      title: s.title,
      id: s.id || slugify(s.title),
      raw: s.raw,
      blocks,
      auths: AUTH_ORDER.filter((a) => seen.has(a)),
    };
  });
}

/** حصادُ السلطات عبر المنهج كلّه — تقرؤه الواجهة الأولى */
export function tally(shots: Shot[]): Record<Auth, number> {
  const n = Object.fromEntries(AUTH_ORDER.map((a) => [a, 0])) as Record<Auth, number>;
  for (const s of shots)
    for (const b of s.blocks) if (b.type === 'out' || b.type === 'gate') n[b.auth]++;
  return n;
}
