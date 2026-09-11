#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>
static _Atomic int n;               /* ذرّيٌّ: لا تعارض في معنى المواصفة */
static void *bump(void *p) {
    (void) p;
    for (int i = 0; i < 100000; i++)
        atomic_fetch_add_explicit(&n, 1, memory_order_relaxed);
    return NULL;
}
int main(void) {
    pthread_t t[2];
    for (int i = 0; i < 2; i++) pthread_create(&t[i], NULL, bump, NULL);
    for (int i = 0; i < 2; i++) pthread_join(t[i], NULL);
    printf("%d\n", n);
    return 0;
}
