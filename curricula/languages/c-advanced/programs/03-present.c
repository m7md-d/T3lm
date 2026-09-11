#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void) {
    long ps = sysconf(_SC_PAGESIZE);
    char *p = mmap(NULL, 8 * (size_t)ps, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    p[0] = 1;
    p[7 * ps] = 1;                              /* الأولى والأخيرة فقط */

    FILE *f = fopen("/proc/self/pagemap", "rb");
    for (int i = 0; i < 8; i++) {
        uint64_t e = 0;
        fseek(f, (long)(((uintptr_t)(p + i * ps) / (uintptr_t)ps) * 8), SEEK_SET);
        fread(&e, sizeof e, 1, f);
        printf("page %d  present=%" PRIu64 "\n", i, (uint64_t)((e >> 63) & 1));
    }
    return 0;
}
