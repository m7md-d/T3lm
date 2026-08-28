/**
 * معجمُ رموز **اللوحة** — لا لوحةَ syntax عامّة.
 *
 * والاشتقاق: المنهج يصنّف مخرَجاته بـ**من يضمنها** (الريدمي §أدواته — أربع
 * سلطات: اللغة · CPython · الإصدار · الجهاز). فيأخذ كلُّ رمزٍ لون مالكه، فيقرأ
 * القارئ سطر مخرَجٍ فيرى بلونه من يضمن أيَّ جزءٍ منه.
 *
 * والألوان كلُّها من العائلات نفسها في `../styles/tokens.css` — بلا خامسة.
 */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * مرورٌ واحد: تناوبٌ مرتّبٌ من الأخصّ إلى الأعمّ، فلا موضعَ محجوزاً يفسد الأرقام.
 * وكلُّ فرعٍ مجموعةٌ مسمّاة، واسمُها هو الصنف.
 */
const LEX = new RegExp(
  [
    // ترفضه الأداة
    '(?<exc>^Traceback \\(most recent call last\\):$|[A-Z][A-Za-z]*(?:Error|Warning|Exception|Iteration)(?=:|\\s))',
    // يقرّره جهازُك: زمنٌ وذاكرةٌ ونسبة
    '(?<machine>-?[\\d,]+(?:\\.\\d+)?\\s*(?:µs|ms|ns|KiB|MiB)\\b|×\\s*[\\d.]+)',
    // يقرّره CPython: العنوان، وسطرُ الأثر
    '(?<cpython>0x(?:…|[0-9a-f]+)|File "[^"]*", line \\d+)',
    // تضمنه اللغة: النوع والقيم المفردة
    '(?<type>&lt;(?:class|bound method|function|generator|cell)[^&]*&gt;)',
    '(?<lang>(?:True|False|None|NotImplemented)(?![A-Za-z_]))',
    // العربية داخل اللوحة سطرٌ من مخرَجٍ حقيقيّ — تُعزَل اتجاهاً لئلّا تختلّ
    // مواضعُها بين الأرقام والأقواس، وتُعاد إلى خطّ النصّ.
    '(?<ar>[\\u0600-\\u06FF\\u0750-\\u077F](?:[\\u0600-\\u06FF\\u0750-\\u077F ]*[\\u0600-\\u06FF\\u0750-\\u077F])?)',
  ].join('|'),
  'gm'
);

const CLS: Record<string, string> = {
  exc: 'pl-exc',
  machine: 'pl-machine',
  cpython: 'pl-cpython',
  type: 'pl-type',
  lang: 'pl-lang',
  ar: 'pl-ar',
};

/** نصّ اللوحة ⇒ HTML بأصنافٍ تعرّفها ورقة التوكنز. */
export function lexPanel(text: string): string {
  return esc(text).replace(LEX, (m, ...args) => {
    const groups = args[args.length - 1] as Record<string, string | undefined>;
    for (const key of Object.keys(CLS)) {
      if (groups[key] !== undefined) return `<span class="${CLS[key]}">${m}</span>`;
    }
    return m;
  });
}
