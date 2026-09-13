#ifndef WAIT_H
#define WAIT_H
#include "thread.h"

/* طابورُ نوم: من ينتظر شرطاً يسجّل نفسه ويخرج من الاختيار،
   ومن يجعل الشرط صحيحاً يوقظه. ولا حلقةَ فحصٍ بينهما. */
struct waitq { struct thread *w[MAX_THREADS]; int n; };

void wq_wait(struct waitq *q);        /* يحجب الجاري ولا يعود حتى يُوقَظ */
void wq_wake_all(struct waitq *q);    /* يصلح للنداء من داخل مقاطعة */
int  wq_waiting(struct waitq *q);
#endif
