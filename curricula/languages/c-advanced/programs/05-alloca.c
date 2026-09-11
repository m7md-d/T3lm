#include <alloca.h>          /* ليست من ISO C */
#include <stdio.h>
#include <stdlib.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

int main(void) {
    int local = 0;
    void *a = alloca(1024);
    void *h = malloc(1024);

    printf("%p ⇐ متغيّرٌ محلّيّ\n", (void *)&local);
    printf("%p ⇐ alloca\n", a);
    printf("%p ⇐ malloc\n", h);
    printf("%ld ⇐ المسافة بين المحلّيّ وalloca بالبايت\n",
           (long)((char *)&local - (char *)a));
    long d_stack = (long)((char *)&local - (char *)a);
    long d_heap  = (long)((char *)&local - (char *)h);
    if (d_heap < 0) d_heap = -d_heap;
    A("alloca داخل إطار المكدّس", d_stack > 0 && d_stack < 4096);
    A("malloc في منطقةٍ أخرى", d_heap > (1L << 20));
    return 0;
}
