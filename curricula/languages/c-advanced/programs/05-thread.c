#include <pthread.h>
#include <stdio.h>

static void A(const char *name, int cond) {   /* تصريحٌ يفحصه tools/verify.py */
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

static void *tls_addr;

static void *body(void *_) {
    (void)_;
    int local = 0;
    tls_addr = &local;
    printf("%p ⇐ متغيّرٌ محلّيّ في الخيط\n", (void *)&local);
    return NULL;
}

int main(void) {
    pthread_attr_t a;
    size_t sz = 0;
    pthread_attr_init(&a);
    pthread_attr_getstacksize(&a, &sz);
    printf("%zu ⇐ كيلوبايت، حجم مكدّس الخيط الافتراضيّ\n", sz >> 10);

    int local = 0;
    printf("%p ⇐ متغيّرٌ محلّيّ في main\n", (void *)&local);

    pthread_t t;
    pthread_create(&t, NULL, body, NULL);
    pthread_join(t, NULL);

    long gap = (long)((char *)&local - (char *)tls_addr);
    if (gap < 0) gap = -gap;
    A("مكدّس الخيط بعيدٌ عن مكدّس main", gap > (1L << 20));
    A("حجم المكدّس الافتراضيّ موجب", sz > 0);
    return 0;
}
