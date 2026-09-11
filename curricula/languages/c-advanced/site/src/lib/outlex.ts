/**
 * معجم تلوين المخرَج — **مشتقٌّ من موضوع هذا المنهج، لا لوحةُ syntax عامّة.**
 *
 * والقاعدة من `site-design` §٨ج: «أصدق اشتقاقٍ أن يكون لونُ الرمز هو لون
 * مالكه». فرموز اللوحة تأخذ ألوان الفئات نفسها التي تأخذها اللوحة:
 *
 *   عنوانٌ ستّ عشريّ · أذونٌ ثلاثة · `[heap]` · مسارٌ في `/`   ⇒  النظام
 *   اسمٌ منشور: `PT_LOAD` · `R_AARCH64_*` · `MAP_SHARED`       ⇒  المواصفة
 *   قسمٌ أو مكتبةٌ أنتجتها الأداة: `.bss` · `libc.so.6`         ⇒  سلسلة الأدوات
 *
 * **ولا فئة خامسة، ولا يأخذ العدد لون جهة** — مالكُ الرقم يختلف من سطرٍ إلى
 * سطر: هذا زمنٌ من العتاد، وذاك ثابتٌ في البرنامج. فيبقى في سلّم النصّ بوزنه.
 */
import { escape } from './md';

interface Rule { re: RegExp; cls: string }

/* ملاحظة: الترتيب هو الأولوية — ما يلتقطه الأسبق لا يعيد الأحقُّ التقاطه. */
const RULES: Rule[] = [
  /* سطرُ محثٍّ: `$ readelf -S hello` — الأمر لا الجواب */
  { re: /^\$ .*$/gm, cls: 'ot-cmd' },
  /* مدى العنوان في `/proc/self/maps`، ثم العنوان المفرد */
  { re: /\b[0-9a-f]{6,16}-[0-9a-f]{6,16}\b/g, cls: 'ot-addr' },
  { re: /\b0x[0-9a-fA-F]+\b/g, cls: 'ot-addr' },
  /* الأذون الثلاثة وسياسة المشاركة: `r-xp` · `---p` */
  { re: /(?<![\w-])[r-][w-][x-][ps](?![\w-])/g, cls: 'ot-addr' },
  /* مناطق النواة المسمّاة */
  { re: /\[(?:heap|stack|vdso|vvar|anon[^\]]*)\]/g, cls: 'ot-addr' },
  /* مسارٌ مطلق */
  { re: /(?<![\w./-])\/(?:[\w.+-]+\/)*[\w.+-]+/g, cls: 'ot-addr' },
  /* اسمٌ من وثيقةٍ منشورة: ELF gABI · POSIX · ترويسات النواة */
  { re: /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g, cls: 'ot-name' },
  { re: /\bmemory_order_[a-z_]+\b/g, cls: 'ot-name' },
  /* قسمٌ أو مكتبةٌ أنتجتها سلسلة الأدوات */
  { re: /(?<![\w.])\.(?:text|data|bss|rodata|plt|got|symtab|strtab|dynsym|dynstr|dynamic|comment|init|fini|rela\.[a-z]+|note[.\w]*)\b/g, cls: 'ot-obj' },
  { re: /\b(?:lib[\w+-]*|ld-[\w.-]+)\.so(?:\.\d+)*\b/g, cls: 'ot-obj' },
];

interface Span { a: number; b: number; cls: string }

/**
 * يُرجع HTML مهرَّباً وفيه `<span>` لكل رمزٍ معروف.
 * **ولا يرمي**: ما لا يطابق يخرج نصّاً كما هو.
 */
export function lexOutput(text: string): string {
  const spans: Span[] = [];
  for (const { re, cls } of RULES) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const a = m.index;
      const b = a + m[0].length;
      if (m[0].length === 0) { re.lastIndex++; continue; }
      if (spans.some((s) => a < s.b && b > s.a)) continue;
      spans.push({ a, b, cls });
    }
  }
  spans.sort((x, y) => x.a - y.a);

  let out = '';
  let at = 0;
  for (const s of spans) {
    if (s.a < at) continue;
    out += escape(text.slice(at, s.a));
    out += `<span class="${s.cls}">${escape(text.slice(s.a, s.b))}</span>`;
    at = s.b;
  }
  return out + escape(text.slice(at));
}
