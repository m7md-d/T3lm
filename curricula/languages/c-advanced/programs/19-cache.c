//! cc: -O2 -D_POSIX_C_SOURCE=200809L
/* قياسان منفصلان: أثرُ حجم مجموعة العمل، وأثرُ الخطوة. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}
static double now_ns(void) {
    struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec * 1e9 + t.tv_nsec;
}

#define HOPS 4000000
#define ROUNDS 5

/* مطاردةُ مؤشّرات على دورةٍ عشوائية: كل قفزةٍ تعتمد على سابقتها */
static double chase(size_t bytes, long line) {
    size_t n = bytes / (size_t) line;
    size_t *idx = malloc(n * sizeof *idx);
    char *buf = calloc(n, (size_t) line);
    for (size_t i = 0; i < n; i++) idx[i] = i;
    for (size_t i = n - 1; i > 0; i--) {          /* خلطٌ ثابت البذرة */
        size_t j = (size_t) (rand() % (int) (i + 1));
        size_t t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    for (size_t i = 0; i < n; i++)                /* دورةٌ واحدة تمرّ بالكلّ */
        *(void **) (buf + idx[i] * line) = buf + idx[(i + 1) % n] * line;

    double lo = 1e18;
    for (int r = 0; r < ROUNDS; r++) {
        void *p = buf;
        double t0 = now_ns();
        for (long h = 0; h < HOPS; h++) p = *(void **) p;
        double ns = (now_ns() - t0) / HOPS;
        if (ns < lo) lo = ns;
        __asm__ volatile("" :: "r"(p));
    }
    free(idx); free(buf);
    return lo;
}

/* خطوةٌ متغيّرة على مجموعةٍ ثابتة: كم سطراً يلمس نفسُ عددِ الوصولات */
static double stride(long step, long line) {
    size_t span = 8u << 20;
    volatile char *buf = calloc(span, 1);
    long touches = 1 << 20;
    double lo = 1e18;
    for (int r = 0; r < ROUNDS; r++) {
        double t0 = now_ns();
        size_t o = 0;
        for (long i = 0; i < touches; i++) {
            buf[o] += 1;
            o += (size_t) step;
            if (o >= span) o = (o % (size_t) step) + 1;
        }
        double ns = (now_ns() - t0) / touches;
        if (ns < lo) lo = ns;
    }
    free((void *) buf);
    (void) line;
    return lo;
}

int main(void) {
    long line = sysconf(_SC_LEVEL1_DCACHE_LINESIZE);
    srand(1);
    printf("declared line size: %ld bytes   (sysconf)\n\n", line);

    size_t sizes[] = { 8u<<10, 32u<<10, 128u<<10, 512u<<10, 2u<<20, 8u<<20, 32u<<20 };
    const char *nm[] = { "8K", "32K", "128K", "512K", "2M", "8M", "32M" };
    double c[7];
    printf("working set   ns per dependent access\n");
    for (int i = 0; i < 7; i++) {
        c[i] = chase(sizes[i], line);
        printf("%-13s %6.2f\n", nm[i], c[i]);
    }

    long steps[] = { 8, 16, 32, 64, 128, 256 };
    double s[6];
    printf("\nstride        ns per touch\n");
    for (int i = 0; i < 6; i++) {
        s[i] = stride(steps[i], line);
        printf("%-13ld %6.2f\n", steps[i], s[i]);
    }

    A("the declared line size is 64 bytes here", line == 64);
    A("a 32M working set costs more per access than an 8K one", c[6] > c[0]);
    A("stride 64 costs more per touch than stride 8", s[3] > s[0]);
    A("and past the line size the cost stops climbing the same way",
      (s[5] - s[3]) < (s[3] - s[0]) * 4);
    return 0;
}
