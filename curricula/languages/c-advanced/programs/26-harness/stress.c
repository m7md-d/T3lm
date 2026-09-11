/* الفاحص: يضغط الـallocator من خيوطٍ كثيرة، ويفحص الثوابت، ثم يقيس. */
#include "alloc.h"
#include <pthread.h>
#include <stdatomic.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define THREADS 4
#define OPS 300000
#define HOLD 64
#define MAILBOX 256
#define MAGIC 0x5AFEB10Cu

struct sig { unsigned tid, serial, size, magic; };

static _Atomic long bad_null, bad_align, bad_sig, ok_blocks;
static void *box[MAILBOX];
static int box_n;
static pthread_mutex_t box_mu = PTHREAD_MUTEX_INITIALIZER;
static _Atomic size_t peak_live;

static double now_ns(void) {
    struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec * 1e9 + t.tv_nsec;
}

static void stamp(void *p, unsigned tid, unsigned serial, unsigned size) {
    struct sig s = { tid, serial, size, MAGIC };
    memcpy(p, &s, sizeof s);
    memset((char *) p + sizeof s, (int) (unsigned char) (serial ^ tid),
           size - sizeof s);
}
static void check(void *p) {
    struct sig s;
    memcpy(&s, p, sizeof s);
    if (s.magic != MAGIC || s.size < sizeof s || s.size > 512) {
        atomic_fetch_add(&bad_sig, 1); return;
    }
    unsigned char want = (unsigned char) (s.serial ^ s.tid);
    for (unsigned i = sizeof s; i < s.size; i++)
        if (((unsigned char *) p)[i] != want) {
            atomic_fetch_add(&bad_sig, 1); return;
        }
    atomic_fetch_add(&ok_blocks, 1);
}

static void box_push(void *p) {
    pthread_mutex_lock(&box_mu);
    if (box_n < MAILBOX) box[box_n++] = p; else { check(p); ta_free(p); }
    pthread_mutex_unlock(&box_mu);
}
static void *box_pop(void) {
    void *p = NULL;
    pthread_mutex_lock(&box_mu);
    if (box_n) p = box[--box_n];
    pthread_mutex_unlock(&box_mu);
    return p;
}

static void *worker(void *arg) {
    unsigned tid = (unsigned) (long) arg;
    void *held[HOLD] = { 0 };
    unsigned seed = tid * 2654435761u + 1;
    for (unsigned i = 0; i < OPS; i++) {
        seed = seed * 1103515245u + 12345u;
        unsigned size = 16 + (seed >> 16) % 497;
        void *p = ta_alloc(size);
        if (!p) { atomic_fetch_add(&bad_null, 1); continue; }
        if ((uintptr_t) p % _Alignof(max_align_t)) atomic_fetch_add(&bad_align, 1);
        stamp(p, tid, i, size);

        unsigned slot = (seed >> 8) % HOLD;
        if (held[slot]) { check(held[slot]); ta_free(held[slot]); held[slot] = NULL; }
        if (i % 4 == 0) box_push(p); else held[slot] = p;

        if (i % 8 == 0) { void *q = box_pop(); if (q) { check(q); ta_free(q); } }
        if (i % 4096 == 0) {
            size_t f, l; ta_stats(&f, &l);
            size_t cur = atomic_load(&peak_live);
            while (l > cur && !atomic_compare_exchange_weak(&peak_live, &cur, l)) { }
        }
    }
    for (int k = 0; k < HOLD; k++) if (held[k]) { check(held[k]); ta_free(held[k]); }
    return NULL;
}

int main(int argc, char **argv) {
    const char *name = argc > 1 ? argv[1] : "?";
    pthread_t t[THREADS];
    double t0 = now_ns();
    for (long i = 0; i < THREADS; i++) pthread_create(&t[i], NULL, worker, (void *) i);
    for (int i = 0; i < THREADS; i++) pthread_join(t[i], NULL);
    double ms = (now_ns() - t0) / 1e6;

    void *p;
    while ((p = box_pop())) { check(p); ta_free(p); }
    size_t from_os, live;
    ta_stats(&from_os, &live);

    long errs = bad_null + bad_align + bad_sig;
    printf("%-8s  %7.0f ms  %6zu KB from os  %6zu KB peak live  %5.2fx  "
           "errors %ld  leftover %zu KB\n",
           name, ms, from_os >> 10, atomic_load(&peak_live) >> 10,
           atomic_load(&peak_live) ? (double) from_os / (double) atomic_load(&peak_live) : 0.0,
           errs, live >> 10);
    return errs ? 1 : 0;
}
