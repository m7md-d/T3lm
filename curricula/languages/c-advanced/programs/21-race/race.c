#include <pthread.h>
#include <stdio.h>
static int n;                       /* كائنٌ عاديّ، ووصولان متعارضان */
static void *bump(void *p) {
    (void) p;
    for (int i = 0; i < 100000; i++) n++;
    return NULL;
}
int main(void) {
    pthread_t t[2];
    for (int i = 0; i < 2; i++) pthread_create(&t[i], NULL, bump, NULL);
    for (int i = 0; i < 2; i++) pthread_join(t[i], NULL);
    printf("%d\n", n);
    return 0;
}
