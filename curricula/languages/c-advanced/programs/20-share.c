//! cc: -pthread -D_POSIX_C_SOURCE=200809L
/* ما الذي يشترك فيه الخيطان، وما الذي يبقى لكلٍّ منهما وحده. */
#include <errno.h>
#include <fcntl.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

static pthread_barrier_t bar;
static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static int *shared;                 /* كائنٌ واحد في الكومة */
static void *stack_of[2];
static int errno_seen[2];

static void *worker(void *arg) {
    long id = (long) arg;
    int local = 0;                  /* في مكدّس هذا الخيط وحده */
    stack_of[id] = &local;

    pthread_mutex_lock(&mu);
    *shared += (int) id + 1;        /* الكومة مشتركة: كلاهما يكتب فيها */
    pthread_mutex_unlock(&mu);

    /* كلُّ خيطٍ يفشل بنداءٍ مختلف، ثم يقرأ errno بعد أن كتبه الآخر */
    errno = 0;
    if (id == 0) close(-1);                         /* EBADF  */
    else         open("/no/such/file", O_RDONLY);   /* ENOENT */
    pthread_barrier_wait(&bar);
    pthread_barrier_wait(&bar);
    errno_seen[id] = errno;
    return NULL;
}

int main(void) {
    shared = malloc(sizeof *shared);
    *shared = 0;
    pthread_barrier_init(&bar, NULL, 2);

    pthread_t t[2];
    for (long i = 0; i < 2; i++) pthread_create(&t[i], NULL, worker, (void *) i);
    for (int i = 0; i < 2; i++) pthread_join(t[i], NULL);

    long gap = (char *) stack_of[0] - (char *) stack_of[1];
    if (gap < 0) gap = -gap;
    printf("one heap object, written by both: %d\n", *shared);
    printf("distance between the two thread stacks: %ld KB\n", gap >> 10);
    printf("errno in thread 0 after both failed: %s\n", strerror(errno_seen[0]));
    printf("errno in thread 1 after both failed: %s\n", strerror(errno_seen[1]));

    size_t sz = 0;                      /* القيمة الافتراضية في سمات POSIX */
    pthread_attr_t at;
    pthread_attr_init(&at);
    pthread_attr_getstacksize(&at, &sz);
    pthread_attr_destroy(&at);
    printf("default stack size in a fresh pthread_attr_t: %zu KB\n", sz >> 10);

    /* اصطلاح pthread: القيمة المرجَعة رقمُ خطأ، وerrno لا يُمَسّ */
    pthread_mutex_t m2;
    pthread_mutex_init(&m2, NULL);
    pthread_mutex_lock(&m2);
    errno = 0;
    int rc = pthread_mutex_trylock(&m2);
    printf("pthread_mutex_trylock returned %s, errno is %d\n", strerror(rc), errno);
    pthread_mutex_unlock(&m2);

    A("both threads reached the same heap object", *shared == 3);
    A("their stacks are far apart", gap > 64 * 1024);
    A("thread 0 kept its own errno", errno_seen[0] == EBADF);
    A("thread 1 kept its own errno", errno_seen[1] == ENOENT);
    A("trylock reported EBUSY as its return value", rc == EBUSY);
    A("and left errno untouched", errno == 0);
    return 0;
}
