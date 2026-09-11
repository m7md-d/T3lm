//! cc: -O2 -pthread -D_GNU_SOURCE
/* نسختان متطابقتان دلالياً: نفس العمليات، ونفس العدد النهائيّ.
   الفرق الوحيد موضعُ العدّادين من سطر الـcache. */
#include <pthread.h>
#include <sched.h>
#include <stdatomic.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}
static double now_ns(void) {
    struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec * 1e9 + t.tv_nsec;
}

#define T 4
#define ITER 20000000
#define ROUNDS 5

struct packed { _Atomic long v; };                 /* أربعةٌ متجاورة */
struct padded { _Alignas(64) _Atomic long v; };    /* كلٌّ في سطرٍ وحده */

static struct packed packed_c[T];
static struct padded padded_c[T];
static int on_cpu[T];
static _Atomic long *slot[T];

static void *bump(void *arg) {
    long id = (long) arg;
    cpu_set_t s; CPU_ZERO(&s); CPU_SET((int) id, &s);
    sched_setaffinity(0, sizeof s, &s);
    on_cpu[id] = sched_getcpu();
    for (long i = 0; i < ITER; i++)
        atomic_fetch_add_explicit(slot[id], 1, memory_order_relaxed);
    return NULL;
}

static double one(int padded) {
    for (long i = 0; i < T; i++) {
        slot[i] = padded ? &padded_c[i].v : &packed_c[i].v;
        atomic_store(slot[i], 0);
    }
    pthread_t t[T];
    double t0 = now_ns();
    for (long i = 0; i < T; i++) pthread_create(&t[i], NULL, bump, (void *) i);
    for (int i = 0; i < T; i++) pthread_join(t[i], NULL);
    return (now_ns() - t0) / 1e6;
}

int main(void) {
    long line = sysconf(_SC_LEVEL1_DCACHE_LINESIZE);
    unsigned long p0 = (unsigned long) &packed_c[0].v, p1 = (unsigned long) &packed_c[1].v;
    unsigned long q0 = (unsigned long) &padded_c[0].v, q1 = (unsigned long) &padded_c[1].v;
    int share_packed = (p0 / (unsigned long) line) == (p1 / (unsigned long) line);
    int share_padded = (q0 / (unsigned long) line) == (q1 / (unsigned long) line);

    double plo = 1e18, phi = 0, dlo = 1e18, dhi = 0;
    long psum = 0, dsum = 0;
    for (int r = 0; r < ROUNDS; r++) {
        double ms = one(0);
        if (ms < plo) plo = ms;
        if (ms > phi) phi = ms;
        double md = one(1);
        if (md < dlo) dlo = md;
        if (md > dhi) dhi = md;
    }
    for (int i = 0; i < T; i++) { psum += packed_c[i].v; dsum += padded_c[i].v; }

    printf("line size %ld   threads %d   increments each %d\n", line, T, ITER);
    printf("threads ran on cpus:");
    for (int i = 0; i < T; i++) printf(" %d", on_cpu[i]);
    printf("   (of %ld online)\n\n", sysconf(_SC_NPROCESSORS_ONLN));
    printf("packed  counters 0 and 1 in one line: %s\n", share_packed ? "yes" : "no");
    printf("padded  counters 0 and 1 in one line: %s\n", share_padded ? "yes" : "no");
    printf("\nlayout   wall ms over %d rounds   final sum\n", ROUNDS);
    printf("packed   %8.0f-%-8.0f        %ld\n", plo, phi, psum);
    printf("padded   %8.0f-%-8.0f        %ld\n", dlo, dhi, dsum);

    A("the packed counters share a cache line", share_packed);
    A("the padded ones do not", !share_padded);
    A("both layouts count exactly the same total", psum == dsum);
    A("and that total is the one the program asked for",
      psum == (long) T * ITER);
    return 0;
}
