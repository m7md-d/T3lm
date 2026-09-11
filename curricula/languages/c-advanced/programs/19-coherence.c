//! cc: -O2 -pthread
/* موقعٌ واحد، خيطان. كلُّ وصولٍ ذرّيٌّ بأضعف ترتيب: لا data race هنا،
   والمفحوص هو الاتّساق على الموقع الواحد وحده. */
#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

#define N 2000000
static _Atomic unsigned x;
static unsigned seen_distinct, went_backwards, reached_last;

static void *writer(void *p) {
    (void) p;
    for (unsigned i = 1; i <= N; i++)
        atomic_store_explicit(&x, i, memory_order_relaxed);
    return NULL;
}

static void *reader(void *p) {
    (void) p;
    unsigned prev = 0, d = 0, back = 0;
    for (long spins = 0; spins < 400000000L; spins++) {
        unsigned v = atomic_load_explicit(&x, memory_order_relaxed);
        if (v != prev) {
            d++;
            if (v < prev) back++;
            prev = v;
        }
        if (v == N) { reached_last = 1; break; }
    }
    seen_distinct = d; went_backwards = back;
    return NULL;
}

int main(void) {
    pthread_t w, r;
    pthread_create(&r, NULL, reader, NULL);
    pthread_create(&w, NULL, writer, NULL);
    pthread_join(w, NULL);
    pthread_join(r, NULL);

    printf("writer stored   %d values\n", N);
    printf("reader sampled  %u distinct values\n", seen_distinct);
    printf("reader saw a smaller value after a larger one: %u times\n", went_backwards);
    printf("reader reached the last value: %s\n", reached_last ? "yes" : "no");

    A("no read of this location ever went backwards", went_backwards == 0);
    A("the last value written became visible in finite time", reached_last);
    A("and the reader missed most of the writes", seen_distinct < N);
    return 0;
}
