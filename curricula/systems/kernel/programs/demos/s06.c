/* المرحلة 06 — kmalloc، وما تحته بلا قفزةٍ سحرية. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"

/* arena تُحرَّر دفعةً واحدة: عقدٌ آخر، لا نسخةٌ بدائية من القائمة */
static uint8_t  arena[512];
static size_t   bump;
static void *bump_alloc(size_t n) {
    n = (n + 15) & ~15ull;
    if (bump + n > sizeof arena) return NULL;
    void *p = &arena[bump]; bump += n; return p;
}

void stage_main(void) {
    serial_init();
    pmm_init(); vmm_init();
    uint64_t frames_before = pmm_free_frames();
    kheap_init();

    size_t used, blocks, frames;
    kheap_stats(&used, &blocks, &frames);
    INFO("after init: used=%zu blocks=%zu frames=%zu", used, blocks, frames);

    char *a = kmalloc(100), *b = kmalloc(2000), *c = kmalloc(48);
    INFO("a=%p b=%p c=%p", a, b, c);
    INFO("gaps: b-a = %lu   c-b = %lu   (header = %lu bytes)",
         (uint64_t)(b - a), (uint64_t)(c - b), (uint64_t)(b - a) - 112);
    kheap_dump();

    /* السلسلة كاملةً لعنوانٍ واحد */
    INFO("--- the chain under one pointer ---");
    INFO("kmalloc gave virtual %p", b);
    INFO("  -> resolve -> physical %p", (void *)vmm_resolve((uint64_t)b));
    vmm_dump((uint64_t)b);

    kfree(b);
    kheap_stats(&used, &blocks, &frames);
    INFO("after freeing b: used=%zu blocks=%zu", used, blocks);
    char *d = kmalloc(2000);
    INFO("re-alloc of the same size gave %p  (same=%s)", d, d == b ? "yes" : "no");

    /* طلبٌ أكبر من صفحةٍ يمدّ النافذة */
    char *big = kmalloc(3 * PAGE_SIZE);
    kheap_stats(&used, &blocks, &frames);
    INFO("12 KiB request: %p   frames now %zu", big, frames);
    INFO("pmm free went %lu -> %lu", frames_before, pmm_free_frames());

    void *x = bump_alloc(64), *y = bump_alloc(64);
    INFO("bump arena: %p then %p, no header between them (gap=%lu)",
         x, y, (uint64_t)((uint8_t *)y - (uint8_t *)x));
    qemu_exit(0);
}
