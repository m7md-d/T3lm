/* ما الذي يعطيه allocator فعلاً مقابل ما طلبتَه.
   malloc_usable_size واجهةٌ من glibc — لا من ISO C — وهي طريقٌ مشروع
   لرؤية التقريب، بلا تجاوزِ حدود الكائن. */
#include <malloc.h>
#include <stdio.h>
#include <stdlib.h>

static void A(const char *name, int cond) {
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    size_t want[] = { 1, 8, 24, 25, 100, 1000, 4096 };
    int all_ge = 1, all_aligned = 1;

    for (size_t i = 0; i < sizeof want / sizeof *want; i++) {
        void  *p = malloc(want[i]);
        size_t u = malloc_usable_size(p);
        printf("%4zu طُلب  →  %4zu صالح للاستعمال  (فائض %zu)\n",
               want[i], u, u - want[i]);
        if (u < want[i]) all_ge = 0;
        if ((unsigned long)p % 16) all_aligned = 0;
        free(p);
    }
    A("الصالح للاستعمال ≥ المطلوب", all_ge);
    A("كل المؤشّرات بمحاذاة ١٦ في هذا التنفيذ", all_aligned);
    return 0;
}
