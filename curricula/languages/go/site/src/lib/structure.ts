import { marked } from 'marked';
import type { Tokens } from 'marked';
import { slugify } from '@t3lm/kit/md';

/* ── البديهيات: ٢٣ إحالة في المتن، بصيغة «البديهية الأولى» … ── */
const ORDINALS: Record<string, number> = {
  'الأولى': 1, 'الثانية': 2, 'الثالثة': 3, 'الرابعة': 4, 'الخامسة': 5,
};

export function axiomsIn(md: string): number[] {
  const out = new Set<number>();
  for (const m of md.matchAll(/البديهية\s+(\S+)/g)) {
    const n = ORDINALS[m[1]!.replace(/[^\p{L}]/gu, '')];
    if (n) out.add(n);
  }
  return [...out].sort();
}

export type Block =
  | { type: 'md'; html: string }
  | { type: 'gate'; output: string; id: string; note?: string }
  | { type: 'out'; text: string; note?: string }
  | { type: 'code'; code: string; lang: string; id: string; runnable: boolean; notice?: string }
  | { type: 'local'; code: string }
  | { type: 'figure'; text: string }
  | { type: 'keyword'; name: string; rows: [string, string][] }
  | { type: 'pending'; label: string; html: string };

const html = (t: Tokens.Generic) => marked.parser([t as never]);

/**
 * بلوك Go يُشغَّل وحده فقط إن كان **برنامجاً كاملاً**: حزمة `main` ودالة `main`.
 * ما عداه مقطعٌ توضيحيّ — تشغيله بلا معنى، وتحريره يَعِد بما لا يُمكن، فيُعرَض
 * للقراءة فقط.
 */
/** بصمة قصيرة للنصّ (FNV-1a) — هويّة البلوك من محتواه لا من موضعه */
function digest(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

function isRunnable(code: string, lang: string): boolean {
  if (lang !== 'go') return false;
  return /^package\s+main\b/m.test(code) && /func\s+main\s*\(/.test(code);
}

/**
 * يفصل نصّ المقطع إلى كتل.
 * العلامات المستخرَجة كلها **معدودة في جدول الاشتقاق** — لا شيء هنا مخترَع.
 * والمعدود اليوم: «المخرَج:» (٤) · `<!-- out -->` (٩) · أوامر محليّة (١).
 * وبطاقات الكلمات والأسئلة المعلّقة مدعومتان ولم تُستعمَلا بعد.
 */
/**
 * توجيهات يكتبها المؤلّف في الماركداون قبل البلوك مباشرة:
 *
 *   <!-- notice: مفسّر المتصفّح لا ينفّذ os.Exit -->   تحذير صدق يُعرَض قبل التشغيل
 *   <!-- run: no -->                                  امنع التشغيل: عرضٌ فقط
 *
 * موضعها الماركداون لا الكود: الملاحظة **محتوى** يعرفه المؤلّف عن مثاله، وقانون
 * ملكيّة المحتوى يمنع سكناها في الموقع.
 */
const NOTICE = /^<!--\s*notice:\s*([\s\S]*?)\s*-->\s*$/;
const NORUN = /^<!--\s*run:\s*no\s*-->\s*$/;
/**
 * `<!-- out -->` يسم البلوك التالي **مخرَجاً مسجَّلاً** بلا بوّابة تنبّؤ.
 *
 * و`<!-- out: … -->` يسمه **مقتطعاً** ويحمل سبب الاقتطاع. الحاجة إليه حقيقية:
 * أثر المكدّس بعد الذُّعر يحمل مسارات جهاز المؤلّف، فلا يصحّ نقله ولا يصحّ حذفه
 * بصمت. **اللوحة تقول عن نفسها إنها ناقصة، ولا يُترَك ذلك للنثر.**
 */
const OUT = /^<!--\s*out(?::\s*([\s\S]*?))?\s*-->\s*$/;

export function splitBlocks(md: string, keyPrefix = ''): Block[] {
  const tokens = marked.lexer(md);
  const out: Block[] = [];
  let gateNext = false;
  let gateNote: string | undefined;
  let pendingName: string | null = null;
  let notice: string | undefined;
  let noRun = false;
  let outNext = false;
  let outNote: string | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;

    /* بطاقة كلمة مفتاحية: عنوان يحمل الاسم، ثم جدول من صفّين فأكثر */
    if (t.type === 'table' && pendingName) {
      const rows = (t as Tokens.Table).rows.map(
        (r) => [r[0]?.text ?? '', r[1]?.text ?? ''] as [string, string]
      ).filter(([a, b]) => a || b);
      out.push({ type: 'keyword', name: pendingName, rows });
      pendingName = null;
      continue;
    }
    pendingName = null;

    if (t.type === 'html') {
      const raw = ((t as Tokens.Generic).raw as string).trim();
      const m = raw.match(NOTICE);
      if (m) { notice = m[1]; continue; }
      if (NORUN.test(raw)) { noRun = true; continue; }
      const o = raw.match(OUT);
      if (o) { outNext = true; outNote = o[1] || undefined; continue; }
    }

    if (t.type === 'paragraph' || t.type === 'heading') {
      const raw = (t as Tokens.Generic).raw as string;
      const kw = raw.match(/^(?:###\s+بطاقة الكلمة المفتاحية:\s*|\*\*)`([^`]+)`\*?\*?\s*$/m);
      const next = tokens[i + 1];
      if (kw && next?.type === 'table') { pendingName = kw[1]!; continue; }
      /* عنوان المخرَج لا يُشترَط إلا وبلوكه خلفه مباشرة، وإلا ابتلع بلوكاً بعيداً.
         و`marked` يدسّ توكن `space` بين الفقرة والسياج، فالنظر يتخطّاه.
         **والفقرة يجب ألّا تحمل إلا الكلمة:** كان الشرط «تحوي المخرَج ثم نقطتين»،
         فجملةٌ عادية فيها «إن كان المخرَج JSON» تصير بوّابةً بلا قصد. */
      let j = i + 1;
      while (tokens[j]?.type === 'space') j++;
      /* «المخرَج:» أو «المخرَج (مقتطع لكذا):» — والقوس يُنقَل إلى ذيل اللوحة */
      const g = raw.trim().match(/^\*{0,2}المخرَج\*{0,2}(?:\s*\(([^)]*)\))?\s*:\s*$/);
      if (tokens[j]?.type === 'code' && g) {
        gateNext = true;
        gateNote = g[1] || undefined;
        /* اللوحة تحتها تقول ما هي بهيئتها، فلا تُطبع الكلمة */
        continue;
      }
    }

    if (t.type === 'blockquote' && /سؤال معلّق/.test((t as Tokens.Generic).raw as string)) {
      const raw = (t as Tokens.Generic).raw as string;
      const label = raw.match(/سؤال معلّق\s*\(([^)]+)\)/)?.[1] ?? '';
      out.push({ type: 'pending', label, html: html(t) });
      continue;
    }

    if (t.type === 'code') {
      const code = (t as Tokens.Code).text;
      const lang = (t as Tokens.Code).lang ?? '';
      if (outNext) {
        out.push({ type: 'out', text: code, note: outNote });
        outNext = false;
        outNote = undefined;
      } else if (gateNext) {
        out.push({ type: 'gate', output: code, id: `${keyPrefix}:${digest(code)}`, note: gateNote });
        gateNext = false;
        gateNote = undefined;
      } else if (lang === 'go' || lang === 'javascript' || lang === 'python') {
        out.push({
          type: 'code', code, lang,
          /* الهويّة من **محتوى** البلوك لا من ترتيبه: إعادة الترقيم بعد تعديل
             الماركداون كانت تُسلّم مسودّة بلوكٍ إلى بلوكٍ آخر. */
          id: `${keyPrefix}:${digest(code)}`,
          runnable: !noRun && isRunnable(code, lang),
          notice,
        });
        notice = undefined;
        noRun = false;
      } else if (lang === 'bash' || lang === 'sh') {
        out.push({ type: 'local', code });
      } else {
        /* مخطّطات البايت ومقتطفات المصدر: نصّ أحاديّ المسافة بلا ادّعاء تشغيل */
        out.push({ type: 'figure', text: code });
      }
      continue;
    }

    out.push({ type: 'md', html: html(t) });
  }
  return out;
}

export interface Station {
  title: string;
  id: string;
  raw: string;
  axioms: number[];
  blocks: Block[];
}

/** البذرة: آخر مقطع في كل إقليم، وهي رابط الإقليم التالي (٣ بذور) */
export const SEED = 'بذرة';

export function buildStations(sections: { title: string; id: string; raw: string }[], key: string): Station[] {
  return sections.map((s) => ({
    title: s.title,
    id: s.id || slugify(s.title),
    raw: s.raw,
    axioms: axiomsIn(s.raw),
    blocks: splitBlocks(s.raw, `${key}:${s.id}`),
  }));
}
