/**
 * سلّم السلطة: ستّة وسومٍ في المصدر تُطوى في أربع فئاتٍ لونية.
 *
 * وأربعٌ حدٌّ لا يُتجاوَز — المعالجة قبل-الانتباهية تميّز أربعاً إلى خمس فئات
 * ثم يصير اللون ضوضاء (أدلّة §٨). والطيّ يتبع معنى الوسوم نفسها كما يشرحها
 * `../../README.md`: ما يضمنه النواةُ، ثم ما يضمنه نصٌّ مكتوبٌ أو أداةٌ بإصدارها،
 * ثم ما تقرّره بيئةُ القارئ، ثم ما لا يُنقَل أصلاً.
 */
import type { Authority, AuthorityTag } from './types';

const FOLD: Record<AuthorityTag, Authority> = {
  '@kernel': 'kernel',
  '@oci': 'tool',
  '@impl': 'tool',
  '@distro': 'env',
  '@vm': 'env',
  '@machine': 'run',
};

/** بلا وسمٍ = `@kernel` — الافتراض في المصدر، والافتراض في الموقع. */
export const authorityOf = (tag?: AuthorityTag | null): Authority =>
  tag ? FOLD[tag] ?? 'kernel' : 'kernel';

/** ما يضمنه كلُّ وسم — يُعرَض في تلميح الوسم لا في نصٍّ مكرّر. */
export const MEANS: Record<AuthorityTag, string> = {
  '@kernel': 'واجهة نواة لينكس',
  '@oci': 'مواصفة OCI المكتوبة',
  '@impl': 'هذه الأداة بهذا الإصدار',
  '@distro': 'التوزيعة وإعداد نواتها',
  '@vm': 'أثرُ أن النواة في آلةٍ افتراضية',
  '@machine': 'هذا التشغيل وحده',
};

export const TAGS = Object.keys(FOLD) as AuthorityTag[];
