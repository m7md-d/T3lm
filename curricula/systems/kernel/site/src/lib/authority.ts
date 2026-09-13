/**
 * من يضمن هذه اللوحة — طيُّ وسوم السلطة الثمانية في أربع عائلات.
 *
 * والطيّ ليس اجتهاداً: `../../README.md` §البيئة يعدّ الوسوم ثمانيةً، والأدلّة
 * §٨ تحدّ الفئات اللونية بأربع. فتُجمَع بمعناها لا بعددها — **مواصفةٌ مكتوبة**
 * تسبق كل تشغيل، و**بيئةُ تشغيل** تختلف بتغيّر الآلة، و**قرارٌ لنا** اخترناه،
 * و`@unspec` **بلا لون** لأن «الغياب في التشغيل ليس منعاً» ولا جهةَ تُصبَغ.
 */
import type { Family, Tag } from './types';

const FOLD: Record<Tag, Family> = {
  arch: 'spec',
  abi: 'spec',
  boot: 'spec',
  qemu: 'env',
  fw: 'env',
  host: 'env',
  ours: 'ours',
  unspec: 'none',
};

export const familyOf = (tag: Tag): Family => FOLD[tag];

export const TAGS = Object.keys(FOLD) as Tag[];
export const FAMILIES: Family[] = ['spec', 'env', 'ours', 'none'];

/** اسم العائلة كما يُعرَض. */
export const FAMILY_NAME: Record<Family, string> = {
  spec: 'المواصفة',
  env: 'هذه البيئة',
  ours: 'قرارُ نواتنا',
  none: 'بلا مالك',
};

/** ما تعنيه العائلة — الصفّ الثاني في صفحة «من يضمن؟». */
export const FAMILY_MEANS: Record<Family, string> = {
  spec: 'نصٌّ منشورٌ يسبق كل تشغيل: مواصفة المعالج، ووثيقة الـABI، وبروتوكول الإقلاع',
  env: 'هذه الآلة وهذا التشغيل: محاكٍ بإعدادٍ مُعلَن، أو جدولٌ من الـfirmware، أو قياسٌ على جهازك',
  ours: 'سياسةٌ اخترناها في هذه النواة، ولا تُقرأ قانوناً لأي نواةٍ أخرى',
  none: 'لا شيء يقرّره، فيختلف بين معالجٍ ومعالج',
};

/** نصُّ الوسم كما يظهر على اللوحة — القناة الثانية مع اللون. */
export const TAG_TEXT: Record<Tag, string> = {
  arch: '@arch', abi: '@abi', boot: '@boot', qemu: '@qemu',
  ours: '@ours', fw: '@fw', unspec: '@unspec', host: '@host',
};

