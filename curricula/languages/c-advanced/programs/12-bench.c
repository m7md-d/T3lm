//! cc: -D_POSIX_C_SOURCE=200809L -O2
/* قياسٌ يعلن حِمْلَه، ويفصل مسارَ الـallocator عن ثمن أوّل لمسةٍ للصفحة. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <time.h>
#include <unistd.h>

static void A(const char *name, int cond) {
    fprintf(stderr, "assert %s  %s\n", cond ? "ok" : "FAIL", name);
}

#define OPS    200000
#define KEEP   4                      /* واحدٌ من كل أربعة يبقى حيّاً */
#define ROUNDS 7
#define ARENA  (256u << 20)

static long PS;

static long rss_kb(void) {
    FILE *f = fopen("/proc/self/statm", "r");
    long t, r; fscanf(f, "%ld %ld", &t, &r); fclose(f);
    return r * PS >> 10;
}
static double now_ns(void) {
    struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec * 1e9 + t.tv_nsec;
}

/* ــ bump على منطقةٍ واحدة، تُهيّأ قبل القياس ــ */
static char *base, *bp, *be;
static size_t bumped;

static void arena_new(int prefault) {
    if (base) munmap(base, ARENA);
    base = mmap(NULL, ARENA, PROT_READ | PROT_WRITE,
                MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (prefault)                                  /* المس كلَّ صفحةٍ قبل التوقيت */
        for (size_t i = 0; i < ARENA; i += (size_t)PS) base[i] = 0;
    bp = base; be = base + ARENA; bumped = 0;
}
static void *bump(size_t n) {
    n = (n + 15) & ~(size_t)15;
    void *r = bp; bp += n; bumped += n; return r;
}
static void bump_free(void *p) { (void)p; }

static size_t size_at(int w, int i) {
    return w == 0 ? 64 : (size_t)(16 + (i * 37) % 497);
}

static void *live[OPS / KEEP + 1];

static double one(int w, void *(*al)(size_t), void (*fr)(void *), long *kb) {
    int n_live = 0;
    long r0 = rss_kb();
    double t0 = now_ns();
    for (int i = 0; i < OPS; i++) {
        void *p = al(size_at(w, i));
        memset(p, 1, 8);
        if (i % KEEP == 0) live[n_live++] = p;
        else fr(p);
    }
    double ns = (now_ns() - t0) / OPS;
    if (kb) *kb = rss_kb() - r0;
    for (int i = 0; i < n_live; i++) fr(live[i]);
    return ns;
}

static double best(int w, void *(*al)(size_t), void (*fr)(void *),
                   int is_bump, int prefault, double *hi, long *kb) {
    double lo = 1e18; *hi = 0;
    if (is_bump) arena_new(prefault);
    one(w, al, fr, NULL);                          /* تسخين، يُطرَح */
    for (int r = 0; r < ROUNDS; r++) {
        if (is_bump) arena_new(prefault);
        long k; double ns = one(w, al, fr, &k);
        if (ns < lo) lo = ns;
        if (ns > *hi) *hi = ns;
        if (r == 0 && kb) *kb = k;
    }
    return lo;
}

int main(void) {
    PS = sysconf(_SC_PAGESIZE);
    printf("الحِمْل: %d عملية · واحدٌ من كل %d يبقى حيّاً · لمسةُ ٨ بايتات لكلٍّ\n",
           OPS, KEEP);
    printf("الحِمْل ٠: حجمٌ ثابت ٦٤ بايتاً · الحِمْل ١: أحجامٌ بين ١٦ و٥١٢\n");
    printf("خيطٌ واحد · %d جولة · يُعرَض أقلُّها وأكثرُها\n\n", ROUNDS);

    double g_lo[2], g_hi[2], c_lo[2], c_hi[2], w_lo[2], w_hi[2];
    long g_kb[2], c_kb[2];

    for (int w = 0; w < 2; w++) {
        g_lo[w] = best(w, malloc, free, 0, 0, &g_hi[w], &g_kb[w]);
        c_lo[w] = best(w, bump, bump_free, 1, 0, &c_hi[w], &c_kb[w]);
        w_lo[w] = best(w, bump, bump_free, 1, 1, &w_hi[w], NULL);

        size_t pages = bumped / (size_t)PS;
        printf("الحِمْل %d — %zu بايتاً نُحتت، أي صفحةٌ جديدة كل %zu حجزة\n",
               w, bumped, pages ? OPS / pages : 0);
        printf("  glibc (كومةٌ مسخَّنة)      %6.1f–%-6.1f ns/op   %6ld KB\n",
               g_lo[w], g_hi[w], g_kb[w]);
        printf("  bump على صفحاتٍ جديدة     %6.1f–%-6.1f ns/op   %6ld KB\n",
               c_lo[w], c_hi[w], c_kb[w]);
        printf("  bump على صفحاتٍ مُهيّأة    %6.1f–%-6.1f ns/op\n\n",
               w_lo[w], w_hi[w]);
    }

    /* لا يُصرَّح إلا بما يثبت في كل تشغيل. والزمن هنا ليس منها. */
    A("الصفحة الجديدة تخدم أكثر من حجزةٍ واحدة", OPS > (int)(bumped / (size_t)PS));
    A("bump يحتجز ذاكرةً أكثر من glibc في الحِمْلين",
      c_kb[0] > g_kb[0] && c_kb[1] > g_kb[1]);
    A("التذبذب داخل المقياس الواحد محسوس، فالجولة الواحدة لا تكفي",
      g_hi[0] > g_lo[0] * 1.2 || c_hi[0] > c_lo[0] * 1.2 ||
      g_hi[1] > g_lo[1] * 1.2 || c_hi[1] > c_lo[1] * 1.2);
    (void)w_hi; (void)c_lo;
    return 0;
}
