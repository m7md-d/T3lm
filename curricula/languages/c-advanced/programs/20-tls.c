//! cc: -pthread -D_POSIX_C_SOURCE=200809L
/* آليّتان لتخزينٍ خاصٍّ بالخيط: واحدةٌ من ISO C، وأخرى من POSIX. */
#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>
#include <stdlib.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

static _Thread_local int counter;          /* ISO C منذ C11 */
static pthread_key_t key;                  /* POSIX */
static _Atomic int destroyed;
static void *tls_addr[2];
static int   tls_value[2];
static int   key_value[2];

static void bye(void *p) {                 /* يُنادى عند انتهاء الخيط */
    atomic_fetch_add(&destroyed, 1);
    free(p);
}

static void *worker(void *arg) {
    long id = (long) arg;
    counter = (int) id + 10;               /* نسخةُ هذا الخيط وحده */
    int *mine = malloc(sizeof *mine);
    *mine = (int) id + 100;
    pthread_setspecific(key, mine);

    for (volatile int i = 0; i < 1000000; i++) { }   /* فرصةٌ للتداخل */

    tls_addr[id]  = &counter;
    tls_value[id] = counter;
    key_value[id] = *(int *) pthread_getspecific(key);
    return NULL;
}

int main(void) {
    pthread_key_create(&key, bye);
    counter = 1;                           /* نسخةُ الخيط الرئيس */

    pthread_t t[2];
    for (long i = 0; i < 2; i++) pthread_create(&t[i], NULL, worker, (void *) i);
    for (int i = 0; i < 2; i++) pthread_join(t[i], NULL);

    printf("_Thread_local counter — main %d, thread 0 %d, thread 1 %d\n",
           counter, tls_value[0], tls_value[1]);
    printf("same name, three addresses: %s\n",
           (&counter != tls_addr[0] && tls_addr[0] != tls_addr[1]) ? "yes" : "no");
    printf("pthread key — thread 0 %d, thread 1 %d\n", key_value[0], key_value[1]);
    printf("destructor calls after both threads ended: %d\n", destroyed);
    pthread_key_delete(key);

    A("each thread had its own _Thread_local object", tls_addr[0] != tls_addr[1]);
    A("and the main thread a third one", &counter != tls_addr[0]);
    A("the values never crossed", tls_value[0] == 10 && tls_value[1] == 11);
    A("one pthread key held a different pointer per thread",
      key_value[0] == 100 && key_value[1] == 101);
    A("and its destructor ran once for each thread that set it", destroyed == 2);
    A("the main thread kept its own counter", counter == 1);
    return 0;
    return 0;
}
