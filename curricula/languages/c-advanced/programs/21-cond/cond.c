/* برنامجٌ متزامنٌ تزامناً صحيحاً — كلُّ وصولٍ إلى الحالة تحت القفل — وجوابُه خطأ. */
#include <pthread.h>
#include <stdio.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static pthread_barrier_t bar;
static int balance, withdrawn, split;

static void *teller(void *p) {
    (void) p;
    if (split) {                        /* الفحص في قفل، والفعل في قفلٍ آخر */
        pthread_mutex_lock(&mu);
        int seen = balance;
        pthread_mutex_unlock(&mu);
        pthread_barrier_wait(&bar);     /* الفجوة بين الفحص والفعل */
        if (seen >= 10) {
            pthread_mutex_lock(&mu);
            balance -= 10; withdrawn += 10;
            pthread_mutex_unlock(&mu);
        }
    } else {                            /* الفحص والفعل في القفل نفسه */
        pthread_barrier_wait(&bar);
        pthread_mutex_lock(&mu);
        if (balance >= 10) { balance -= 10; withdrawn += 10; }
        pthread_mutex_unlock(&mu);
    }
    return NULL;
}

static void round_of(int s, const char *label) {
    split = s; balance = 10; withdrawn = 0;
    pthread_barrier_init(&bar, NULL, 2);
    pthread_t t[2];
    for (int i = 0; i < 2; i++) pthread_create(&t[i], NULL, teller, NULL);
    for (int i = 0; i < 2; i++) pthread_join(t[i], NULL);
    pthread_barrier_destroy(&bar);
    printf("%-28s balance %4d   withdrawn %3d\n", label, balance, withdrawn);
}

int main(void) {
    printf("two tellers, one account of 10, each wants 10\n\n");
    round_of(1, "check and act split");
    int bad_b = balance, bad_w = withdrawn;
    round_of(0, "check and act under one lock");

    A("splitting them takes the account below zero", bad_b == -10);
    A("and hands out more than the account held", bad_w == 20);
    A("holding the lock across both keeps it whole", balance == 0);
    A("and hands out exactly what was there", withdrawn == 10);
    return 0;
}
