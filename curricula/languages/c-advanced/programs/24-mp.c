//! cc: -O2 -pthread -D_POSIX_C_SOURCE=200809L
/* تمرير رسالة: بياناتٌ ثم علم. كلُّ وصولٍ ذرّيّ، فالبرنامج معرَّفُ السلوك
   وما يظهر منه قابلٌ للنسبة إلى النموذج وإلى ما تحته. */
#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

#define N 120000
#define SPINS 400
static _Atomic int data, flag;
static pthread_barrier_t bar;
static int mode;                       /* 0 relaxed · 1 release/acquire · 2 fences */
static long bad, good, never;

static void *writer(void *p) {
    (void) p;
    for (int i = 0; i < N; i++) {
        atomic_store_explicit(&data, 0, memory_order_relaxed);
        atomic_store_explicit(&flag, 0, memory_order_relaxed);
        pthread_barrier_wait(&bar);                    /* الحالة صُفِّرت */
        if (mode == 0) {
            atomic_store_explicit(&data, 42, memory_order_relaxed);
            atomic_store_explicit(&flag, 1, memory_order_relaxed);
        } else if (mode == 1) {
            atomic_store_explicit(&data, 42, memory_order_relaxed);
            atomic_store_explicit(&flag, 1, memory_order_release);
        } else {
            atomic_store_explicit(&data, 42, memory_order_relaxed);
            atomic_thread_fence(memory_order_release);
            atomic_store_explicit(&flag, 1, memory_order_relaxed);
        }
        pthread_barrier_wait(&bar);                    /* انتهت الجولة */
    }
    return NULL;
}

static void *reader(void *p) {
    (void) p;
    for (int i = 0; i < N; i++) {
        pthread_barrier_wait(&bar);
        int f = 0, d = 0;
        for (int s = 0; s < SPINS; s++) {
            f = (mode == 1) ? atomic_load_explicit(&flag, memory_order_acquire)
                            : atomic_load_explicit(&flag, memory_order_relaxed);
            if (f) break;
        }
        if (mode == 2) atomic_thread_fence(memory_order_acquire);
        if (!f) never++;                               /* لم تُقرَأ قيمة الكاتب */
        else {
            d = atomic_load_explicit(&data, memory_order_relaxed);
            if (d == 42) good++; else bad++;
        }
        pthread_barrier_wait(&bar);
    }
    return NULL;
}

static void round_of(int m, const char *label) {
    mode = m; bad = good = never = 0;
    pthread_barrier_init(&bar, NULL, 2);
    pthread_t w, r;
    pthread_create(&r, NULL, reader, NULL);
    pthread_create(&w, NULL, writer, NULL);
    pthread_join(w, NULL); pthread_join(r, NULL);
    pthread_barrier_destroy(&bar);
    printf("%-24s message seen %7ld   flag without data %6ld   flag never read %7ld\n",
           label, good, bad, never);
}

int main(void) {
    printf("%d rounds: writer sets data then flag; reader spins on flag then reads data\n\n", N);
    round_of(0, "relaxed / relaxed");
    long relaxed_bad = bad;
    round_of(1, "release / acquire");
    long ra_bad = bad, ra_good = good;
    round_of(2, "release fence / acquire fence");
    long fence_bad = bad;

    A("release/acquire never showed the flag without the data", ra_bad == 0);
    A("the fence pair gave the same guarantee", fence_bad == 0);
    A("and the reader did receive the message", ra_good > 0);
    printf("\nrelaxed rounds that saw flag=1 with data=0: %ld\n", relaxed_bad);
    return 0;
}
