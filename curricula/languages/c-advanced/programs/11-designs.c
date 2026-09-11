/* أربعة تصاميم، وحِمْلان. المقياس: كم بايتاً طلب كلُّ تصميمٍ من النظام. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <unistd.h>

static void A(const char *name, int cond) {
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

static size_t from_os;                       /* ما طُلب من النظام */
#define CHUNK (1u << 20)

static void *chunk(void) {
    from_os += CHUNK;
    return mmap(NULL, CHUNK, PROT_READ | PROT_WRITE,
                MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
}

/* ــ ١) bump: يتقدّم ولا يرجع. التحرير الفرديّ لا وجود له ــ */
static char *bp, *be;
static void *bump(size_t n) {
    n = (n + 15) & ~(size_t)15;
    if (!bp || (size_t)(be - bp) < n) { bp = chunk(); be = bp + CHUNK; }
    void *r = bp; bp += n; return r;
}

/* ــ ٢) free list: ترويسةٌ inline، وقائمةٌ واحدة، وأوّلُ ما يكفي ــ */
struct node { size_t size; struct node *next; };
static struct node *freelist;
static char *fp, *fe;

static void *fl_alloc(size_t n) {
    n = (n + 15 + sizeof(struct node)) & ~(size_t)15;
    for (struct node **c = &freelist; *c; c = &(*c)->next)
        if ((*c)->size >= n) { struct node *r = *c; *c = r->next; return r + 1; }
    if (!fp || (size_t)(fe - fp) < n) { fp = chunk(); fe = fp + CHUNK; }
    struct node *r = (struct node *)fp; fp += n;
    r->size = n; return r + 1;
}
static void fl_free(void *p) {
    if (!p) return;
    struct node *r = (struct node *)p - 1;
    r->next = freelist; freelist = r;        /* بلا دمجٍ للمتجاور */
}

/* ــ ٣) slab: حجمٌ واحد، وقائمةٌ من كائناتٍ متطابقة ــ */
#define OBJ 64
static void **slab_free;
static char *sp, *se;

static void *slab_alloc(void) {
    if (slab_free) { void *r = slab_free; slab_free = *slab_free; return r; }
    if (!sp || (size_t)(se - sp) < OBJ) { sp = chunk(); se = sp + CHUNK; }
    void *r = sp; sp += OBJ; return r;
}
static void slab_release(void *p) { *(void **)p = slab_free; slab_free = p; }

/* ــ ٤) arena: bump، ثم تُرمى الحزمة كلّها دفعةً واحدة ــ */
static char *ap, *ae;
static void *arena_chunks[64];
static int   n_arena;

static void *arena(size_t n) {
    n = (n + 15) & ~(size_t)15;
    if (!ap || (size_t)(ae - ap) < n) { ap = chunk(); ae = ap + CHUNK; arena_chunks[n_arena++] = ap; }
    void *r = ap; ap += n; return r;
}
static void arena_drop(void) {
    for (int i = 0; i < n_arena; i++) munmap(arena_chunks[i], CHUNK);
    n_arena = 0; ap = ae = NULL;
}

/* ــ الحِمْلان ــ */
#define N 20000

static size_t run(const char *who, int churn) {
    from_os = 0;
    bp = be = fp = fe = sp = se = ap = ae = NULL;
    freelist = NULL; slab_free = NULL; n_arena = 0;

    void *live[N];
    for (int round = 0; round < 8; round++)
        for (int i = 0; i < N; i++) {
            if      (!strcmp(who, "bump"))  live[i] = bump(OBJ);
            else if (!strcmp(who, "free"))  live[i] = fl_alloc(OBJ);
            else if (!strcmp(who, "slab"))  live[i] = slab_alloc();
            else                            live[i] = arena(OBJ);
            if (churn && i) {                 /* حرّر السابق فوراً */
                if      (!strcmp(who, "free")) fl_free(live[i - 1]);
                else if (!strcmp(who, "slab")) slab_release(live[i - 1]);
            }
        }
    if (!strcmp(who, "arena")) arena_drop();
    return from_os >> 20;
}

int main(void) {
    const char *names[] = { "bump", "free", "slab", "arena" };
    size_t hold[4], churn[4];

    printf("التصميم   حِمْلٌ يحتفظ   حِمْلٌ يُحرِّر فوراً   (ميغابايت من النظام)\n");
    for (int i = 0; i < 4; i++) {
        hold[i]  = run(names[i], 0);
        churn[i] = run(names[i], 1);
        printf("%-9s %8zu %14zu\n", names[i], hold[i], churn[i]);
    }

    A("bump لا يستفيد من التحرير الفوريّ", churn[0] == hold[0]);
    A("free list يعيد استعمال ما حُرِّر", churn[1] < hold[1]);
    A("slab يعيد استعمال ما حُرِّر", churn[2] < hold[2]);
    A("arena يطلب مثل bump ويرجع كلَّه دفعةً", churn[3] == hold[3]);
    return 0;
}
