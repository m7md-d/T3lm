#include <stdio.h>
#include <sys/mman.h>
#include <unistd.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

static long rss_pages(void) {
    FILE *f = fopen("/proc/self/statm", "r");
    long total, res;
    fscanf(f, "%ld %ld", &total, &res);
    fclose(f);
    return res;
}

int main(void) {
    long ps = sysconf(_SC_PAGESIZE);
    size_t n = 256u << 20;                      /* ٢٥٦ ميغابايت */

    long r0 = rss_pages();
    printf("%ld ⇐ صفحاتٌ مقيمة قبل الحجز\n", r0);
    char *p = mmap(NULL, n, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    long r1 = rss_pages();
    printf("%ld ⇐ صفحاتٌ مقيمة بعد حجز ٢٥٦ ميغابايت\n", r1);

    for (size_t i = 0; i < (64u << 20); i += (size_t)ps) p[i] = 1;
    long r2 = rss_pages();
    printf("%ld ⇐ صفحاتٌ مقيمة بعد لمس ٦٤ ميغابايت\n", r2);

    A("الحجز وحده لا يجلب صفحات", r1 - r0 < 8);
    A("اللمس يجلب صفحةً لكل صفحةٍ لُمست", r2 - r1 >= (64L << 20) / ps - 8);
    return 0;
}
