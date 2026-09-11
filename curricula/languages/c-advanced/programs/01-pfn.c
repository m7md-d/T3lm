#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <sys/mman.h>
#include <unistd.h>
static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    long ps = sysconf(_SC_PAGESIZE);
    char *p = mmap(NULL, 4 * (size_t)ps, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    for (int i = 0; i < 4; i++) p[i * ps] = 1;        /* المسّ يجلب الصفحة */

    FILE *f = fopen("/proc/self/pagemap", "rb");
    if (!f) { puts("لا يُفتَح pagemap — يحتاج CAP_SYS_ADMIN"); return 0; }
    int present = 0;
    for (int i = 0; i < 4; i++) {
        uint64_t e = 0;
        fseek(f, (long)(((uintptr_t)(p + i * ps) / (uintptr_t)ps) * 8), SEEK_SET);
        fread(&e, sizeof e, 1, f);
        printf("virtual +%d  present=%" PRIu64 "  pfn=%" PRIu64 "\n",
               i, (uint64_t)((e >> 63) & 1), (uint64_t)(e & ((1ULL << 55) - 1)));
        present += (int)((e >> 63) & 1);
    }
    A("الصفحات الأربع حاضرة بعد اللمس", present == 4);
    return 0;
}
