#include "wait.h"
#include "sched.h"
#include "panic.h"

int wq_waiting(struct waitq *q) { return q->n; }

void wq_wait(struct waitq *q) {
    if (q->n == MAX_THREADS) panic("waitq: full");
    struct thread *me = thread_current();
    q->w[q->n++] = me;

    /* الترتيب شرط: نُسجَّل في الطابور **قبل** أن نُحجَب.
       ولو حُجبنا أوّلاً لوقعت لحظةٌ نحن فيها خارج الاختيار وخارج الطابور،
       فيمرّ الموقِظ ولا يجدنا — وهو «الإشعار الضائع». */
    thread_block();
}

/* تُنادى من معالج مقاطعة: لا تخصّص ولا تنتظر ولا تبدّل سياقاً */
void wq_wake_all(struct waitq *q) {
    for (int i = 0; i < q->n; i++) thread_unblock(q->w[i]);
    q->n = 0;
}
