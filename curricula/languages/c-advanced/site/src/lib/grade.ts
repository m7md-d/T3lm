/**
 * درجةُ الدليل — **كيف** تحقّق الفاحص من اللوحة، لا هل «نجحت».
 *
 * والفرق مقصود: `../../README.md` يكتب حكم الغياب صراحةً — «outcome ظهر ⇒
 * شاهدٌ على أنه قابل للوصول هنا … **أمّا outcome لم يظهر فليس تصريحاً سالباً**».
 * فشارةُ «نجح» تقرأ برهاناً على الادّعاء، والتشغيل شاهدٌ عليه.
 *
 * والمفردات من `../../tools/verify.py` نفسه.
 */
import type { Bind, Grade, PanelBlock } from './types';

export function gradeOf(role: 'out' | 'gate' | 'err' | 'warn' | 'shell', bind: Bind): Grade {
  if (role === 'shell') return 'manual';
  if (role === 'err') return 'reject';
  if (role === 'warn') return 'warn';
  return bind === 'runs' ? 'semantic' : 'exact';
}

export const GRADE_LABEL: Record<Grade, string> = {
  exact: 'تُقارَن نصّاً',
  semantic: 'تصريحاتُ البرنامج',
  manual: 'يدويةٌ مُعلَنة',
  reject: 'رفضُ المترجم',
  warn: 'تحذيرُ المترجم',
};

export const GRADE_MEANS: Record<Grade, string> = {
  exact: 'الفاحص يترجم البرنامج ويشغّله، ويقارن مخرَجه بهذه اللوحة سطراً سطراً.',
  semantic:
    'أرقامُ هذه اللوحة تختلف بين تشغيلين — عنوانٌ أو زمنٌ أو عدد — فلا تُقارَن نصّاً. '
    + 'ويقوم مقامها ما يطبعه البرنامج من تصريحات: عنوانٌ بعنوان، ومقدارٌ قبلُ بمقدارٍ بعدُ.',
  manual: 'من خارج الحاوية — أداةُ نظامٍ أو منصّةٌ أخرى. تُعدّ وتُذكر يدويةً، ولا تسقط صامتة.',
  reject: 'الفاحص يفحص أنّ الترجمة تفشل فعلاً، وأنّ نصّ اللوحة يظهر في رسالة المترجم.',
  warn: 'الفاحص يفحص أنّ الترجمة تنجح، وأنّ نصّ التحذير يظهر في رسالة المترجم.',
};

export const isPanel = (b: { kind: string }): b is PanelBlock => b.kind === 'panel';
