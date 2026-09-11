#include <stdio.h>
#include <sys/mman.h>
#include <unistd.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    long pages = sysconf(_SC_PHYS_PAGES), ps = sysconf(_SC_PAGESIZE);
    printf("%ld ⇐ ميغابايت من الذاكرة الفيزيائية\n", pages * ps >> 20);

    FILE *f = fopen("/proc/sys/vm/overcommit_memory", "r");
    int mode = -1;
    if (f) { fscanf(f, "%d", &mode); fclose(f); }
    printf("%d ⇐ vm.overcommit_memory\n", mode);

    size_t want = 64ull << 30;                  /* ٦٤ غيغابايت */
    void *p = mmap(NULL, want, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    printf("%s ⇐ حجزُ ٦٤ غيغابايت\n", p == MAP_FAILED ? "فشل" : "نجح");

    A("المطلوب أكبر من الذاكرة الفيزيائية", (long long)want > (long long)pages * ps);
    A("النظام قبل الحجز", p != MAP_FAILED);
    return 0;
}
