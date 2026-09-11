#include <stdio.h>

static int hidden(void) { return 1; }          /* محلّيّ: لا يعبر حدّ الملفّ  */
int shared(void) { return hidden(); }          /* عامّ: يُرى من وحدةٍ أخرى     */
__attribute__((weak)) int maybe(void) { return 2; }   /* ضعيف: يُزاح بقويّ  */
int uninit;                                    /* تعريفٌ مؤقّت — الفصل يفصّله */

void greet(void) { puts("hi"); }               /* puts غيرُ معرَّفٍ هنا       */
