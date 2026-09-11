/* هل يتذكّر الـallocator ما حرّرتَه؟ */
#include <stdio.h>
#include <stdlib.h>

static void A(const char *name, int cond) {
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    void *a = malloc(64);
    printf("%p ⇐ الحجز الأوّل\n", a);
    free(a);

    void *b = malloc(64);
    printf("%p ⇐ حجزٌ بالحجم نفسه بعد التحرير\n", b);

    void *c = malloc(64);
    printf("%p ⇐ حجزٌ ثالث بلا تحرير\n", c);

    A("الحجم نفسه يعود إلى العنوان نفسه في هذا التنفيذ", a == b);
    A("الحجز الثالث في موضعٍ آخر", c != b);
    free(b); free(c);
    return 0;
}
