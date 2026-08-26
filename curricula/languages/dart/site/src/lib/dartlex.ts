/**
 * معجم المخرَج — تلوينٌ **مشتقٌّ من الموضوع**، لا لوحة syntax عامّة.
 *
 * ولا محلّل لمخرَجٍ حرٍّ في أيّ منظومة، فالمعجم هو الأداة الصحيحة هنا؛ أمّا
 * الكود فمحلّل CodeMirror ولا يُرتجَل (`../components/Code.tsx`).
 *
 * ويقول أربعة أشياء وحدها، وكلُّها مقروءةٌ من نصّ اللوحة نفسه:
 *
 *   رفضٌ ومَن رفض   `Error:` · `Unhandled exception:` · اسم الاستثناء · `^^^`
 *   موضعٌ في ملفّك   `main.dart:7:19` · `#0  main (main.dart:3:5)`
 *   نوعٌ هو الجواب   `double` · `List<int>` — و`runtimeType` سؤال المنهج من ٠٠
 *   قيمةٌ هي الجواب   `true` · `false` · `null`
 *
 * **والرقمُ لا يُرمَّد لأنه كبير.** التقلّب يُعلَن في المصدر بـ`<!-- runs -->`
 * ولا يُخمَّن من الشكل: `9007199254740992` في الإقليم ٠٢ **هو** المقصد،
 * و`218 م.ث` في الإقليم ١٢ محضُ جهاز. فالوسم يقرّر، لا عددُ الخانات.
 *
 * ── والعربية داخل اللوحة ──
 * تسعٌ وخمسون لوحةً من ١٤٣ تطبع نصّاً عربياً (`مرفوض: حقولٌ 2 لا ٣`). والخليّة
 * الأحادية الثابتة تفكّ وصل الحروف، وأكثرُ خطوط المونو بلا عربية أصلاً. فكلُّ
 * مقطعٍ عربيّ يُلَفّ ويُعاد إلى خطّ المتن معزولَ الاتجاه — **وهذا هو السبب
 * الذي جعل هذا المعجم يمرّ على كل سطرٍ حتى في اللوحات التي لا لون فيها.**
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Rule { re: RegExp; cls: string; title?: string }

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿][؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿\s‏‎]*/g;

const REJECT = [
  'Unhandled exception', 'Error', 'Context', 'Warning', 'Info',
  'Out of Memory', 'Compilation failed', 'Failed assertion',
].join('|');

const EXC = [
  'LateInitializationError', 'NoSuchMethodError', 'RangeError', 'StateError',
  'ArgumentError', 'AssertionError', 'FormatException', 'UnsupportedError',
  'UnimplementedError', 'ConcurrentModificationError', 'IntegerDivisionByZeroException',
  'StackOverflowError', 'OutOfMemoryError', 'TypeError', 'CastError',
  'IsolateSpawnException', 'FileSystemException', 'TimeoutException',
  'PathNotFoundException', 'Exception',
].join('|');

const TYPES = [
  'int', 'double', 'num', 'String', 'bool', 'List', 'Map', 'Set', 'Iterable',
  'Object', 'Null', 'Never', 'dynamic', 'void', 'Future', 'Stream', 'Symbol',
  'Type', 'Record', 'BigInt', 'Duration', 'Function',
].join('|');

/* الترتيب يحكم: الأخصّ أوّلاً، ولا تداخل. */
const RULES: Rule[] = [
  { re: /…/g, cls: 'wild', title: 'تطابق أيّ شيء — غير مضمون' },
  { re: ARABIC, cls: 'ar' },

  { re: new RegExp(`\\b(?:${REJECT}):`, 'g'), cls: 'd-no' },
  { re: new RegExp(`\\b(?:${EXC})\\b`, 'g'), cls: 'd-no' },
  { re: /\^{2,}|(?<=\s)\^(?=\s|$)/g, cls: 'd-no', title: 'موضع الخطأ كما يشير إليه المترجم' },

  { re: /#\d+\s+/g, cls: 'd-loc', title: 'إطارٌ في أثر المكدّس' },
  { re: /\b[\w.-]+\.(?:dart|js|c)(?::\d+(?::\d+)?)?/g, cls: 'd-loc' },

  { re: new RegExp(`\\b(?:${TYPES})\\b(?:<[\\w, <>?]+>)?\\??`, 'g'), cls: 'd-type' },
  { re: /\b(?:true|false|null)\b/g, cls: 'd-key' },
];

/* لا تُطبَّق إلا حين تُعلِن اللوحة نفسها `<!-- runs -->`، **وقبل قاعدة العربية**:
   وحدةُ القياس نفسها عربية (`م.ث`) فتبقى لخطّ المتن، والرقمُ وحده هو المتقلّب. */
const VOLATILE: Rule[] = [
  { re: /\b\d+(?:[.,]\d+)?(?=\s*(?:م\.ث|م\.ب|ms|µs|ns|MB|KB|s)\b)/g, cls: 'd-vol', title: 'يتغيّر بكل تشغيل' },
  { re: /\b\d{4,}\b/g, cls: 'd-vol', title: 'يتغيّر بكل تشغيل' },
];

function paintLine(line: string, rules: Rule[]): string {
  const taken = new Array<boolean>(line.length).fill(false);
  const marks: { s: number; e: number; cls: string; title?: string }[] = [];

  for (const r of rules) {
    r.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.re.exec(line))) {
      if (m[0].length === 0) { r.re.lastIndex++; continue; }
      const s = m.index;
      const e = s + m[0].length;
      let free = true;
      for (let i = s; i < e; i++) if (taken[i]) { free = false; break; }
      if (!free) continue;
      for (let i = s; i < e; i++) taken[i] = true;
      marks.push({ s, e, cls: r.cls, title: r.title });
    }
  }

  if (marks.length === 0) return esc(line);
  marks.sort((a, b) => a.s - b.s);

  let out = '';
  let at = 0;
  for (const mk of marks) {
    if (mk.s < at) continue;
    out += esc(line.slice(at, mk.s));
    const t = mk.title ? ` title="${mk.title}"` : '';
    out += `<span class="${mk.cls}"${t}>${esc(line.slice(mk.s, mk.e))}</span>`;
    at = mk.e;
  }
  return out + esc(line.slice(at));
}

/** ولا ترمي أبداً — ما لا يطابق يبقى نصّاً مهرَّباً كما هو. */
export function paintOutput(output: string, volatile = false): string {
  const rules = volatile ? [RULES[0]!, ...VOLATILE, ...RULES.slice(1)] : RULES;
  return output.split('\n').map((l) => paintLine(l, rules)).join('\n');
}

/** أسطرٌ مطليّةٌ منفردة — كلُّ سطرٍ عنصرٌ باتّجاهٍ تلقائيّ (`dir="auto"`). */
export const paintLines = (output: string, volatile = false): string[] =>
  paintOutput(output, volatile).split('\n');

/** هل في السطر عربية؟ يستعمله الفحص الآليّ لعدّ ما يحتاج فكَّ الأحاديّ. */
export const hasArabic = (s: string): boolean => {
  ARABIC.lastIndex = 0;
  return ARABIC.test(s);
};
