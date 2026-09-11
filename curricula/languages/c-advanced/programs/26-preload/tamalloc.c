/* المخصِّص الكامل: يُبنى مكتبةً مشتركة ويحلّ محلّ مخصِّص النظام بـLD_PRELOAD.
   والعقد هنا عقدُ `malloc` كما في الفصل `09`، لا واجهةً خاصّةً بنا. */
#define _GNU_SOURCE
#include <pthread.h>
#include <stdatomic.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <sys/mman.h>
#include <unistd.h>

#define CHUNK (4u << 20)
#define NCLASS 6
static const size_t CLASS[NCLASS] = { 16, 32, 64, 128, 256, 512 };
#define HDR 16                       /* يبقي الحمولة محاذاةً لـ16 */
/* بصمةٌ في الترويسة: نُسلَّم مؤشّراتٍ لم نحجزها نحن، ويجب أن نعرفها */
#define MAGIC 0x7A4D410000ULL
#define MMAP_CLS (MAGIC | 0xFFu)

struct hdr { size_t cls, len; };

static pthread_mutex_t mu = PTHREAD_MUTEX_INITIALIZER;
static char *bump, *end;
static void *freelist[NCLASS];
static _Atomic size_t n_alloc, n_free, from_os, big_blocks, foreign, foreign_re;

static int class_of(size_t n) {
    for (int i = 0; i < NCLASS; i++) if (n <= CLASS[i]) return i;
    return -1;
}

void *malloc(size_t n) {
    if (n == 0) n = 1;                         /* مؤشّرٌ فريدٌ يصحّ تحريره */
    atomic_fetch_add(&n_alloc, 1);
    int c = class_of(n);
    if (c < 0) {                               /* كبيرٌ: mapping مستقلّ */
        size_t page = (size_t) sysconf(_SC_PAGESIZE);
        size_t total = (n + HDR + page - 1) & ~(page - 1);
        char *p = mmap(NULL, total, PROT_READ | PROT_WRITE,
                       MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
        if (p == MAP_FAILED) return NULL;
        atomic_fetch_add(&from_os, total);
        atomic_fetch_add(&big_blocks, 1);
        ((struct hdr *) p)->cls = MMAP_CLS;
        ((struct hdr *) p)->len = total;
        return p + HDR;
    }
    pthread_mutex_lock(&mu);
    void *b;
    if (freelist[c]) {
        b = freelist[c];
        memcpy(&freelist[c], b, sizeof(void *));
    } else {
        size_t need = CLASS[c] + HDR;
        if (!bump || (size_t)(end - bump) < need) {
            bump = mmap(NULL, CHUNK, PROT_READ | PROT_WRITE,
                        MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
            if (bump == MAP_FAILED) { bump = end = NULL;
                                      pthread_mutex_unlock(&mu); return NULL; }
            end = bump + CHUNK;
            atomic_fetch_add(&from_os, CHUNK);
        }
        b = bump; bump += need;
    }
    pthread_mutex_unlock(&mu);
    ((struct hdr *) b)->cls = MAGIC | (size_t) c;
    ((struct hdr *) b)->len = CLASS[c];
    return (char *) b + HDR;
}

void free(void *p) {
    if (!p) return;                            /* free(NULL) لا شيء */
    atomic_fetch_add(&n_free, 1);
    struct hdr *h = (struct hdr *) ((char *) p - HDR);
    if ((h->cls & ~0xFFULL) != MAGIC) { atomic_fetch_add(&foreign, 1); return; }
    if (h->cls == MMAP_CLS) { munmap(h, h->len); return; }
    int c = (int) (h->cls & 0xFFu);
    pthread_mutex_lock(&mu);
    memcpy(h, &freelist[c], sizeof(void *));
    freelist[c] = h;
    pthread_mutex_unlock(&mu);
}

void *calloc(size_t a, size_t b) {
    if (a && b > (size_t) -1 / a) return NULL; /* الفيض يُفحَص */
    size_t n = a * b;
    void *p = malloc(n);
    if (p) memset(p, 0, n);
    return p;
}

void *realloc(void *p, size_t n) {
    if (!p) return malloc(n);
    if (n == 0) { free(p); return NULL; }
    struct hdr *h = (struct hdr *) ((char *) p - HDR);
    if ((h->cls & ~0xFFULL) != MAGIC) {      /* مؤشّرٌ ليس منّا: لا نعرف حجمه */
        atomic_fetch_add(&foreign_re, 1);
        return malloc(n);
    }
    size_t usable = h->cls == MMAP_CLS ? h->len - HDR : h->len;
    if (n <= usable) return p;
    void *q = malloc(n);
    if (!q) return NULL;
    memcpy(q, p, usable);
    free(p);
    return q;
}

static void put(const char *s) { write(2, s, strlen(s)); }
static void num(size_t v) {
    char d[24]; int k = 0;
    do { d[k++] = (char) ('0' + v % 10); v /= 10; } while (v);
    while (k) write(2, &d[--k], 1);
}
__attribute__((destructor)) static void report(void) {
    put("tamalloc: "); num(atomic_load(&n_alloc)); put(" alloc, ");
    num(atomic_load(&n_free)); put(" free, ");
    num(atomic_load(&big_blocks)); put(" over 512 bytes, ");
    num(atomic_load(&foreign)); put(" foreign free, ");
    num(atomic_load(&foreign_re)); put(" foreign realloc, ");
    num(atomic_load(&from_os) >> 10); put(" KB from os\n");
}
