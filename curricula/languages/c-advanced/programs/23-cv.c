//! cc: -pthread -D_POSIX_C_SOURCE=200809L
/* ثلاث جولات: إشعارٌ يسبق الانتظار، ثم الصيغة الصحيحة، ثم برهانُ التحرير والعودة. */
#include <errno.h>
#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>
#include <time.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

static pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t  cv = PTHREAD_COND_INITIALIZER;
static int ready;                       /* الـpredicate، محميٌّ بالقفل */
static int rc_wait;
static _Atomic int about_to_wait, seq, seq_at_return;

static void deadline(struct timespec *t, long ms) {
    clock_gettime(CLOCK_REALTIME, t);
    t->tv_nsec += ms * 1000000L;
    if (t->tv_nsec >= 1000000000L) { t->tv_sec++; t->tv_nsec -= 1000000000L; }
}

/* جولة ١: ينتظر بلا أن يفحص الـpredicate أوّلاً */
static void *blind(void *p) {
    (void) p;
    struct timespec t; deadline(&t, 300);
    pthread_mutex_lock(&m);
    rc_wait = pthread_cond_timedwait(&cv, &m, &t);   /* بلا while، وبلا فحص */
    pthread_mutex_unlock(&m);
    return NULL;
}

/* جولة ٢: يفحص الـpredicate في حلقة */
static void *careful(void *p) {
    (void) p;
    struct timespec t; deadline(&t, 300);
    pthread_mutex_lock(&m);
    rc_wait = 0;
    while (!ready) {
        rc_wait = pthread_cond_timedwait(&cv, &m, &t);
        if (rc_wait == ETIMEDOUT) break;
    }
    pthread_mutex_unlock(&m);
    return NULL;
}

/* جولة ٣: يدخل الانتظار فعلاً، ثم يعود */
static void *prover(void *p) {
    (void) p;
    pthread_mutex_lock(&m);
    while (!ready) {
        atomic_store(&about_to_wait, 1);
        pthread_cond_wait(&cv, &m);
    }
    seq_at_return = atomic_load(&seq);
    pthread_mutex_unlock(&m);
    return NULL;
}

int main(void) {
    pthread_t t;

    /* ١ — الحالة تغيّرت وأُشعِر عنها قبل أن يصل المنتظِر */
    pthread_mutex_lock(&m); ready = 1; pthread_cond_signal(&cv); pthread_mutex_unlock(&m);
    pthread_create(&t, NULL, blind, NULL); pthread_join(t, NULL);
    int blind_rc = rc_wait;

    /* ٢ — نفس الترتيب بالضبط، والمنتظِر يفحص أوّلاً */
    ready = 1;
    pthread_create(&t, NULL, careful, NULL); pthread_join(t, NULL);
    int careful_rc = rc_wait;

    /* ٣ — المنتظِر يدخل الانتظار، والقفل يجب أن يكون حرّاً حينها */
    ready = 0; about_to_wait = 0; seq = 0;
    pthread_create(&t, NULL, prover, NULL);
    while (!atomic_load(&about_to_wait)) { }
    int tries = 0;
    while (pthread_mutex_trylock(&m) != 0) tries++;   /* نجح ⇒ القفل مُحرَّر */
    int free_while_waiting = (ready == 0);
    ready = 1;
    pthread_cond_signal(&cv);
    atomic_store(&seq, 1);                            /* قبل التحرير */
    pthread_mutex_unlock(&m);
    pthread_join(t, NULL);

    printf("round 1  signal before wait, no predicate check : %s\n",
           blind_rc == ETIMEDOUT ? "timed out" : "returned");
    printf("round 2  same order, predicate checked first    : %s\n",
           careful_rc == 0 ? "returned at once" : "timed out");
    printf("round 3  trylock while the waiter is inside wait: succeeded after %d tries\n",
           tries);
    printf("round 3  seq observed by the waiter on return   : %d\n", seq_at_return);

    A("a signal sent before the wait is not stored anywhere", blind_rc == ETIMEDOUT);
    A("the predicate carries the state, so round 2 never waits", careful_rc == 0);
    A("the mutex is free while the thread sits in cond_wait", free_while_waiting);
    A("and the waiter returns only after reacquiring it", seq_at_return == 1);
    return 0;
}
