// البديهية ١٠ — التزامن لا يعطي ترتيباً ضمنياً.
//! cc: -pthread
#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>

#define N 200000

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

static atomic_int x, y;                 /* المفحوصان */
static int r0, r1;
static atomic_int cnt, sense;           /* حاجزٌ لخيطين */
static long both_zero;

static void wait_all(int *my) {
    *my = !*my;
    if (atomic_fetch_add(&cnt, 1) == 1) { atomic_store(&cnt, 0); atomic_store(&sense, *my); }
    else while (atomic_load(&sense) != *my) { }
}

static void *other(void *_) {
    (void)_;
    int my = 0;
    for (int i = 0; i < N; i++) {
        wait_all(&my);                                          /* افتح النافذة */
        atomic_store_explicit(&y, 1, memory_order_relaxed);
        r1 = atomic_load_explicit(&x, memory_order_relaxed);
        wait_all(&my);                                          /* أغلقها */
        wait_all(&my);                                          /* بعد التصفير */
    }
    return NULL;
}

int main(void) {
    pthread_t th;
    int my = 0;
    pthread_create(&th, NULL, other, NULL);

    for (int i = 0; i < N; i++) {
        wait_all(&my);
        atomic_store_explicit(&x, 1, memory_order_relaxed);
        r0 = atomic_load_explicit(&y, memory_order_relaxed);
        wait_all(&my);
        if (r0 == 0 && r1 == 0) both_zero++;
        atomic_store_explicit(&x, 0, memory_order_relaxed);
        atomic_store_explicit(&y, 0, memory_order_relaxed);
        wait_all(&my);
    }
    pthread_join(th, NULL);

    printf("r0 == 0 && r1 == 0  :  %ld / %d\n", both_zero, N);

    A("الحالة المرصودة أقلّ من كل الدورات", both_zero < N);
    A("العدد غير سالب", both_zero >= 0);
    return 0;
}
