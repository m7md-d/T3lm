/**
 * من أنتج اللوحة، وبأي حكم.
 *
 * العلامة في الماركداون تحمل الاثنين معاً، فتُفَكّ إلى محورين مستقلّين:
 * **الحكم** لونٌ (ثلاث فئات)، و**الآلة** وسمٌ نصّيّ. فلوحةٌ رفضها dart2js
 * حمراءُ اللون موسومةٌ `@web`، ولا تحتاج فئةً رابعة.
 *
 * والأوامر ليست زينة: هي **ما يشغّله `../../../tools/verify.py` حرفياً**، وما
 * يطلب `../../../README.md` من القارئ أن يشغّله (كلُّ بلوكٍ يُحفَظ `main.dart`).
 */
import type { Machine, Mark, Verdict } from './types';

const VERDICT: Record<Mark, Verdict> = {
  out: 'ok', runs: 'ok', shell: 'ok', web: 'ok', aot: 'ok',
  err: 'no', 'web-err': 'no', 'aot-err': 'no',
  c: 'c',
};

const MACHINE: Record<Mark, Machine> = {
  out: '@vm', err: '@vm', runs: '@vm',
  web: '@web', 'web-err': '@web',
  aot: '@aot', 'aot-err': '@aot',
  c: 'C',
  shell: '$',
};

const COMMAND: Record<Mark, string> = {
  out:       'dart run main.dart',
  err:       'dart run main.dart',
  runs:      'dart run main.dart',
  web:       'dart compile js -o main.js main.dart && node main.js',
  'web-err': 'dart compile js -o main.js main.dart',
  aot:       'dart compile exe -o main.exe main.dart && ./main.exe',
  'aot-err': 'dart compile exe -o main.exe main.dart',
  c:         'cc -O2 -o t t.c && ./t',
  shell:     '',
};

export const verdictOf = (m: Mark): Verdict => VERDICT[m];
export const machineOf = (m: Mark): Machine => MACHINE[m];
export const commandOf = (m: Mark): string => COMMAND[m];

/** ما يضمنه كلُّ وسم — في تلميحه، لا في نصٍّ مكرّر تحت كل لوحة. */
export const MEANS: Record<Machine, string> = {
  '@vm': 'الآلة الافتراضية على جهازٍ أصليّ',
  '@web': 'بعد الترجمة إلى JavaScript',
  '@aot': 'الترجمة المسبقة وحدها',
  'C': 'لغة المرساة — البرنامج المقابل في C',
  '$': 'أوامرُ صدفةٍ في مجلّد المشروع',
};

export const VERDICT_MEANS: Record<Verdict, string> = {
  ok: 'عمل، وهذا مخرَجه',
  no: 'رُفِض قبل أن يعمل',
  c: 'لغة المرساة',
};
