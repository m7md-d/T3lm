/* العقد: ما تضمنه ISO C، وما يضيفه POSIX، وما يفعله تنفيذٌ بعينه. */
#include <stdalign.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>

static void A(const char *name, int cond) {
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    printf("%zu ⇐ alignof(max_align_t)\n", alignof(max_align_t));

    void *z = malloc(0);
    printf("%s ⇐ ما أعادته malloc(0)\n", z ? "مؤشّرٌ فريد" : "NULL");
    free(z);
    free(NULL);
    printf("ok ⇐ free(NULL) وfree لما أعادته malloc(0)\n");

    void *p = malloc(1);
    int p_ok = (uintptr_t)p % alignof(max_align_t) == 0;
    printf("%zu ⇐ باقي قسمة مؤشّرِ malloc(1) على alignof(max_align_t)\n",
           (size_t)((uintptr_t)p % alignof(max_align_t)));
    free(p);

    void *q = aligned_alloc(64, 128);
    int q_ok = q && (uintptr_t)q % 64 == 0;
    printf("%zu ⇐ باقي قسمة aligned_alloc(64,128) على ٦٤\n",
           (size_t)((uintptr_t)q % 64));
    free(q);

    errno = 0;
    volatile size_t n = SIZE_MAX / 2;            /* كي لا يطويها المترجم */
    void *huge = calloc(n, 4);
    printf("%s ⇐ calloc بحاصلِ ضربٍ يفيض\n", huge ? "أعاد مؤشّراً" : "أعاد NULL");
    printf("%d ⇐ errno بعدها (12 = ENOMEM)\n", errno);

    A("malloc(1) بمحاذاة max_align_t على الأقلّ", p_ok);
    A("aligned_alloc يحترم المحاذاة المطلوبة", q_ok);
    A("calloc ترفض الفيضان ولا تعيد كتلةً صغيرة", huge == NULL);
    return 0;
}
