/* البديهية ٧ — allocator كامل، تسعة أسطر عاملة. يُبنى مكتبةً ويوضع تحت برنامجٍ حقيقيّ.
   ويُترجَم بـ‎-fno-builtin: المترجم يعرف معنى هذه الأسماء، ويعيد كتابة أجسامها
   نداءً لنفسها إن لم تمنعه. والسبب في الفصل `26`. */
#include <stddef.h>
#include <string.h>
#include <unistd.h>

static char  arena[64u << 20];   /* في BSS: صفحاتٌ تُحجَز عند أوّل لمسة */
static size_t off;
static unsigned long calls;

void *malloc(size_t n) {
    calls++;
    size_t need = (n + 15u) & ~(size_t)15;
    if (off + need + 16 > sizeof arena) return NULL;
    char *p = arena + off + 16;
    ((size_t *)p)[-1] = n;       /* حجمُنا نحن، في تخطيطٍ نعلنه */
    off += need + 16;
    return p;
}
void  free(void *p) { (void)p; }
void *calloc(size_t a, size_t b) { void *p = malloc(a * b); if (p) memset(p, 0, a * b); return p; }
void *realloc(void *p, size_t n) {
    void *q = malloc(n);
    if (p && q) memcpy(q, p, ((size_t *)p)[-1] < n ? ((size_t *)p)[-1] : n);
    return q;
}

__attribute__((destructor)) static void report(void) {
    char b[64] = "mymalloc: ";
    int i = 10;
    char d[24]; int k = 0;
    unsigned long v = calls;
    do { d[k++] = (char)('0' + v % 10); v /= 10; } while (v);
    while (k) b[i++] = d[--k];
    memcpy(b + i, " calls\n", 7); i += 7;
    write(2, b, (size_t)i);
}
