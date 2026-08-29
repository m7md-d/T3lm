/**
 * معجمُ رموز **اللوحة** — لا لوحةَ syntax عامّة.
 *
 * والاشتقاق: المنهج يصنّف كلَّ رقمٍ بـ**من يضمنه** (أربع سلطات: `@math` ·
 * `@rule` · `@precision` · `@colorspace`). فيأخذ كلُّ رمزٍ لون سلطته، ويبقى
 * ما لا سلطةَ له رمادياً — لأن الصفحة كلَّها رمادية، واللونُ معلومةٌ لا زينة.
 */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LEX = new RegExp(
  [
    /* السلطة مكتوبةً في اللوحة نفسها */
    '(?<auth>@(?:math|rule|precision|colorspace)\\b)',
    /* يقرّره جهازُك: زمنٌ ونسبة */
    '(?<machine>[\\d,]+(?:\\.\\d+)?\\s*(?:ms|µs|ns)\\b|(?<=\\s)[\\d.]+×)',
    /* حكمُ الفحص */
    '(?<fail>\\bFAIL\\b|خارج المدى)',
    '(?<verdict>\\bok\\b|متطابقتان|مختلفتان)',
    /* وحدةُ الموضوع: البكسل، والقناة، والمدى */
    '(?<unit>\\b\\d+(?:\\.\\d+)?\\s*px\\b|\\b\\d+×\\d+\\b|\\(\\s*-?\\d+(?:,\\s*-?\\d+)+\\s*\\))',
    /* عددٌ عاديّ — أساسُ كلّ لوحةٍ هنا */
    '(?<num>[-+]?\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?%?)',
    /* اسمُ مشهدٍ أو حالةٍ بالإنجليزية */
    '(?<ident>\\b(?:nonzero|even-odd|miter|round|bevel|butt|square|float|Skia|src|dst|clear|xor|src-over|dst-over|src-in|dst-in|src-out|dst-out|src-atop|dst-atop)\\b)',
    /* العربية داخل اللوحة سطرٌ من مخرَجٍ حقيقيّ — تُعزَل وتُعاد إلى خطّ النصّ */
    '(?<ar>[\\u0600-\\u06FF\\u0750-\\u077F][\\u0600-\\u06FF\\u0750-\\u077F ًٌٍَُِّْـ]*)',
  ].join('|'),
  'gm'
);

const CLS: Record<string, string> = {
  auth: 'pk-auth',
  machine: 'pk-machine',
  fail: 'pk-fail',
  verdict: 'pk-verdict',
  unit: 'pk-unit',
  num: 'pk-num',
  ident: 'pk-ident',
  ar: 'pk-ar',
};

/** نصّ اللوحة ⇒ HTML بأصنافٍ تعرّفها ورقة التوكنز. */
export function lexPanel(text: string): string {
  return esc(text).replace(LEX, (m, ...args) => {
    const g = args[args.length - 1] as Record<string, string | undefined>;
    for (const k of Object.keys(CLS)) if (g[k] !== undefined) return `<span class="${CLS[k]}">${m}</span>`;
    return m;
  });
}
