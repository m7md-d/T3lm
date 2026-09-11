#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

static int in_heap;

static void where(void *p, const char *what) {
    char line[512];
    FILE *f = fopen("/proc/self/maps", "r");
    while (fgets(line, sizeof line, f)) {
        unsigned long lo, hi;
        if (sscanf(line, "%lx-%lx", &lo, &hi) == 2 &&
            (unsigned long)p >= lo && (unsigned long)p < hi) {
            line[strcspn(line, "\n")] = 0;
            printf("%s\n   ⇐ %s\n", line, what);
            in_heap = strstr(line, "[heap]") != NULL;
        }
    }
    fclose(f);
}

int main(void) {
    void *small = malloc(64);
    void *big   = malloc(64u << 20);
    where(small, "حجزٌ صغير");
    int small_heap = in_heap;
    where(big,   "حجزٌ كبير");
    int big_heap = in_heap;

    A("الصغير في [heap]", small_heap);
    A("الكبير خارج [heap]", !big_heap);
    return 0;
}
