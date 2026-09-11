//! cc: -D_DEFAULT_SOURCE
/* من أين يأتي الـheap، ومتى يتغيّر المصدر. */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>

static void A(const char *name, int cond) {
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    void *b0 = sbrk(0);
    printf("%p ⇐ حدّ الـheap عند البدء\n", b0);

    void *keep = NULL;
    for (int i = 0; i < 2000; i++) keep = malloc(64);
    (void)keep;
    void *b1 = sbrk(0);
    printf("%p ⇐ بعد ٢٠٠٠ حجزةٍ صغيرة\n", b1);
    printf("%ld ⇐ كم كيلوبايتاً تحرّك الحدّ\n", ((char *)b1 - (char *)b0) >> 10);

    void *big = malloc(64u << 20);
    void *b2  = sbrk(0);
    printf("%p ⇐ بعد حجزِ ٦٤ ميغابايت\n", b2);

    /* أين سكن الكبير فعلاً؟ لا نستنتج المصدر من سكون الحدّ */
    int in_heap = 0, found = 0;
    char line[512];
    FILE *m = fopen("/proc/self/maps", "r");
    while (fgets(line, sizeof line, m)) {
        unsigned long lo, hi;
        if (sscanf(line, "%lx-%lx", &lo, &hi) == 2 &&
            (unsigned long)big >= lo && (unsigned long)big < hi) {
            found = 1;
            in_heap = strstr(line, "[heap]") != NULL;
            line[strcspn(line, "\n")] = 0;
            printf("%s\n   ⇐ الـmapping الذي سكنه الحجز الكبير\n", line);
        }
    }
    fclose(m);

    A("الحجوزات الصغيرة حرّكت حدّ الـheap", b1 != b0);
    A("الحجزُ الكبير لم يحرّك الحدّ", b2 == b1);
    A("والحجزُ الكبير سكن mapping ليس هو [heap]", found && !in_heap);
    return 0;
}
