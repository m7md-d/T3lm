//! cc: -O2 -pthread -D_POSIX_C_SOURCE=200809L
/* ABA على مكدّس Treiber، بتداخلٍ مثبَّتٍ بحاجزين — فالنتيجة تتكرّر.
   والعقد في مجموعةٍ ثابتة: إعادةُ التدوير مشكلةٌ أخرى، خارج هذا المثال. */
#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>

static void A(const char *n, int c) {
    fprintf(stderr, "assert %s  %s\n", c ? "ok" : "FAIL", n);
}

#define EMPTY 0
static struct { int value; int next; } pool[3];   /* A B C ثابتةٌ في مكانها */
static _Atomic unsigned long head;
static int tagged;
static pthread_barrier_t b1, b2;
static int popped[4], n_popped;

static unsigned long pack(int idx, unsigned long tag) {
    unsigned long slot = (unsigned long) (idx + 1);
    return tagged ? (tag << 32) | slot : slot;
}
static int slot_of(unsigned long h) { return (int) (h & 0xffffffffu) - 1; }
static unsigned long tag_of(unsigned long h) { return tagged ? h >> 32 : 0; }

static int pop(void) {                       /* pop عاديّ، بحلقة CAS */
    for (;;) {
        unsigned long h = atomic_load(&head);
        int i = slot_of(h);
        if (i < 0) return -1;
        unsigned long nh = pack(pool[i].next, tag_of(h) + 1);
        if (atomic_compare_exchange_weak(&head, &h, nh)) return i;
    }
}
static void push(int i) {
    for (;;) {
        unsigned long h = atomic_load(&head);
        pool[i].next = slot_of(h);
        if (atomic_compare_exchange_weak(&head, &h, pack(i, tag_of(h) + 1)))
            return;
    }
}

/* T1: يقرأ الرأس والتالي، ثم يتوقّف، ثم ينفّذ CAS بما قرأه */
static void *slow_popper(void *p) {
    (void) p;
    unsigned long h = atomic_load(&head);
    int i = slot_of(h);
    int next = pool[i].next;
    pthread_barrier_wait(&b1);
    pthread_barrier_wait(&b2);
    if (atomic_compare_exchange_strong(&head, &h, pack(next, tag_of(h) + 1)))
        popped[n_popped++] = i;              /* ظنّ أنه انتزع الرأس بسلام */
    else
        popped[n_popped++] = pop();          /* أعاد المحاولة */
    return NULL;
}

/* T2: يفرّغ عقدتين ثم يعيد الأولى — فيعود الرأس إلى القيمة نفسها */
static void *churner(void *p) {
    (void) p;
    pthread_barrier_wait(&b1);
    int a = pop();
    int b = pop();
    push(a);
    popped[n_popped++] = b;
    pthread_barrier_wait(&b2);
    return NULL;
}

static void scenario(int t, const char *label) {
    tagged = t; n_popped = 0;
    for (int i = 0; i < 3; i++) { pool[i].value = 'A' + i; pool[i].next = i - 1; }
    atomic_store(&head, pack(2, 1));         /* C على الرأس: C→B→A */
    pthread_barrier_init(&b1, NULL, 2);
    pthread_barrier_init(&b2, NULL, 2);
    pthread_t x, y;
    pthread_create(&x, NULL, slow_popper, NULL);
    pthread_create(&y, NULL, churner, NULL);
    pthread_join(x, NULL); pthread_join(y, NULL);
    pthread_barrier_destroy(&b1); pthread_barrier_destroy(&b2);

    int seen[3] = { 0 };
    printf("%-9s popped:", label);
    for (int i = 0; i < n_popped; i++)
        if (popped[i] >= 0) { printf(" %c", pool[popped[i]].value); seen[popped[i]]++; }
    printf("   still on the stack:");
    for (unsigned long h = atomic_load(&head); slot_of(h) >= 0;
         h = pack(pool[slot_of(h)].next, 0)) {
        printf(" %c", pool[slot_of(h)].value);
        seen[slot_of(h)]++;
    }
    int dup = 0, lost = 0;
    for (int i = 0; i < 3; i++) { if (seen[i] > 1) dup++; if (seen[i] == 0) lost++; }
    printf("   (%d counted twice, %d lost)\n", dup, lost);
    if (t) { A("with a tag, no node is counted twice", dup == 0);
             A("and none is lost", lost == 0); }
    else   { A("a bare pointer lets a node be handed out twice", dup > 0); }
}

int main(void) {
    printf("stack C -> B -> A; one thread pauses mid-pop while another\n");
    printf("pops two nodes and pushes the first one back\n\n");
    scenario(0, "untagged");
    scenario(1, "tagged");
    return 0;
}
