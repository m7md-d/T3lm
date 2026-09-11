#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
static int n;
static int touch;                   /* يقرّر أيُّ مسارٍ يُنفَّذ */
static void *work(void *p) {
    (void) p;
    if (touch)                      /* المسار المتسابق — لا يُنفَّذ دائماً */
        for (int i = 0; i < 100000; i++) n++;
    return NULL;
}
int main(int argc, char **argv) {
    touch = argc > 1 ? atoi(argv[1]) : 0;
    pthread_t t[2];
    for (int i = 0; i < 2; i++) pthread_create(&t[i], NULL, work, NULL);
    for (int i = 0; i < 2; i++) pthread_join(t[i], NULL);
    printf("%d\n", n);
    return 0;
}
