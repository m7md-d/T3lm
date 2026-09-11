/**
 * من يضمن هذه اللوحة — طيُّ تسعة وسومٍ في أربع فئات.
 *
 * والطيّ ليس اجتهاداً: `../../README.md` §التحقّق يأمر به بنصّه —
 * «لا يُعطى كلُّ مصدرٍ لوناً: حدُّ الأدلّة أربع فئاتٍ لونية دلالية، فتُجمَع
 * المصادر في أربعٍ على الأكثر — المواصفات · النظام وlibc والـallocator ·
 * المترجم والـlinker · العتاد — ويبقى **اسم المصدر نصّاً** على اللوحة».
 *
 * و`@ub` خارج الأربع لأنه خارج الضمان أصلاً: «لا أحد يعد بشيء» (`verify.py`).
 * فلا يأخذ لوناً — والغيابُ هو الدلالة.
 */
import type { Family, Tag } from './types';

/**
 * `@impl` وحده يقع في جهتين، فيُقسَم بما تسمّيه ملاحظتُه.
 *
 * والافتراض «سلسلة الأدوات» لأن الفاحص يعرّفه هكذا: «`@impl` معرَّفٌ بالتنفيذ:
 * **المترجم اختار**، ويُلزَم بتوثيق اختياره». وينتقل إلى النظام حين تسمّي
 * الملاحظة libc أو المحمّل.
 */
const SYSTEM_IMPL = /glibc|ld\.so|pthread|libc/;

const FOLD: Record<Exclude<Tag, 'impl'>, Family> = {
  spec: 'spec',
  posix: 'spec',
  abi: 'spec',
  os: 'sys',
  env: 'sys',
  unspec: 'tool',
  machine: 'hw',
  ub: 'none',
};

export function familyOf(tag: Tag, note = ''): Family {
  if (tag === 'impl') return SYSTEM_IMPL.test(note) ? 'sys' : 'tool';
  return FOLD[tag];
}

/** اسم الفئة كما يُعرَض. */
export const FAMILY_NAME: Record<Family, string> = {
  spec: 'المواصفة',
  sys: 'النظام وlibc',
  tool: 'سلسلة الأدوات',
  hw: 'العتاد وهذا التشغيل',
  none: 'بلا ضمان',
};

/** ما تضمنه الفئة — الصفّ الثاني في صفحة «من يضمن؟». */
export const FAMILY_MEANS: Record<Family, string> = {
  spec: 'نصٌّ منشورٌ يسبق كل تشغيل: ISO C، وPOSIX، ووثيقة الـABI',
  sys: 'نظامٌ وlibc وallocator، بإصدارٍ بعينه وإعدادٍ مُعلَن',
  tool: 'ما يختاره المترجم أو الرابط ضمن ما تسمح به المواصفة',
  hw: 'هذه المعمارية وهذه التشغيلة: عنوانٌ، أو زمنٌ، أو عدد',
  none: 'لا أحد. والمخرَج مسجَّلٌ لا موعود',
};

/** نصُّ الوسم كما يظهر على اللوحة — القناة الثانية مع اللون. */
export const TAG_TEXT: Record<Tag, string> = {
  spec: '@spec',
  posix: '@posix',
  abi: '@abi',
  os: '@os',
  env: '@env',
  impl: '@impl',
  unspec: '@unspec',
  machine: '@machine',
  ub: '@ub',
};

/** ما يعنيه الوسم في `verify.py` — يُعرَض في صفحة «من يضمن؟» وفي التلميح. */
export const TAG_MEANS: Record<Tag, string> = {
  spec: 'المواصفة تضمنه على كل مترجم — الافتراض، فلا يُكتَب',
  posix: 'وعدٌ مكتوبٌ أيضاً، لكن في POSIX لا في مواصفة C',
  abi: 'الـABI يقرّره: تمرير الوسائط، والإرجاع، والسجلّات المحفوظة',
  os: 'نظام التشغيل يقرّره: الـmappings والصفحات وسياساتها',
  env: 'يتغيّر بإعدادٍ مُعلَن: إصدار libc، أو sysctl، أو صورة المختبر',
  impl: 'معرَّفٌ بالتنفيذ: المترجم اختار، ويُلزَم بتوثيق اختياره',
  unspec: 'غير محدَّد: يختار بلا أن يُعلن، وقد يختار غيره في بناءٍ آخر',
  machine: 'هذه الآلة وهذا التشغيل: عنوانٌ، أو زمنٌ، أو حدُّ منصّة',
  ub: 'غير معرَّف: لا أحد يعد بشيء، والمخرَج مسجَّلٌ لا موعود',
};

export const TAGS = Object.keys(TAG_TEXT) as Tag[];
export const FAMILIES: Family[] = ['spec', 'sys', 'tool', 'hw', 'none'];
