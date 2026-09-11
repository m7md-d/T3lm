#include <stdio.h>
#include <sys/mman.h>
#include <unistd.h>
static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    long ps = sysconf(_SC_PAGESIZE);
    char *p = mmap(NULL, 3 * (size_t)ps, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    munmap(p + ps, (size_t)ps);            /* الصفحة الوسطى وحدها */

    int seen = 0;
    unsigned long lo0 = 0, hi0 = 0, lo1 = 0;
    char line[512];
    FILE *f = fopen("/proc/self/maps", "r");
    while (fgets(line, sizeof line, f)) {
        unsigned long lo, hi;
        if (sscanf(line, "%lx-%lx", &lo, &hi) == 2 &&
            hi > (unsigned long)p && lo < (unsigned long)p + 3 * ps) {
            printf("%s", line);
            if (seen == 0) { lo0 = lo; hi0 = hi; }
            else if (seen == 1) lo1 = lo;
            seen++;
        }
    }
    A("الإلغاء شقّ المدى مدَيَين", seen == 2);
    A("الثقب بمقدار صفحة", seen == 2 && lo1 - hi0 == (unsigned long)ps);
    (void)lo0;
    return 0;
}
