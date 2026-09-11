//! cc: -D_DEFAULT_SOURCE
/* ما الذي يبقى محجوزاً بعد التحرير، ومتى يعود إلى النظام. */
#include <malloc.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#define N 200000

static void A(const char *name, int cond) {
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

static long rss(void) {
    FILE *f = fopen("/proc/self/statm", "r");
    long t, r; fscanf(f, "%ld %ld", &t, &r); fclose(f);
    return r * sysconf(_SC_PAGESIZE) >> 10;          /* كيلوبايت */
}

int main(void) {
    static void *p[N];
    for (int i = 0; i < N; i++) p[i] = malloc(64);
    long a = rss();
    printf("%ld ⇐ كيلوبايت مقيمة بعد ٢٠٠٠٠٠ حجزة\n", a);

    for (int i = 0; i < N; i += 2) free(p[i]);       /* واحدةٌ بين كلّ اثنتين */
    long b = rss();
    printf("%ld ⇐ بعد تحرير نصفها\n", b);

    malloc_trim(0);
    long c = rss();
    printf("%ld ⇐ بعد malloc_trim\n", c);

    A("التحرير وحده لا يُنقص المقيم", b > a * 9 / 10);
    A("المقيم بعد التحرير ما زال قريباً من ذروته", c > a / 2);
    return 0;
}
