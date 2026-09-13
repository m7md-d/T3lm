/* حدودُ الحماية: ما يفرضه العتاد حين تطلبه، وما يبقى مفتوحاً حين تنساه. */
#include "sec.h"
#include "vmm.h"
#include "pmm.h"
#include "kheap.h"
#include "log.h"

extern char __kernel_start[], __kernel_end[];

#define CR4_SMEP (1ull << 20)
#define CR4_SMAP (1ull << 21)

static void cpuid7(uint32_t *ebx) {
    uint32_t a, b, c, d;
    __asm__ volatile("cpuid" : "=a"(a), "=b"(b), "=c"(c), "=d"(d) : "a"(7), "c"(0));
    *ebx = b;
}
bool sec_smep_supported(void) { uint32_t b; cpuid7(&b); return (b >> 7) & 1; }
bool sec_smap_supported(void) { uint32_t b; cpuid7(&b); return (b >> 20) & 1; }

void sec_enable_smep(void) {
    uint64_t cr4;
    __asm__ volatile("mov %%cr4,%0" : "=r"(cr4));
    cr4 |= CR4_SMEP;
    __asm__ volatile("mov %0,%%cr4" :: "r"(cr4) : "memory");
}

/* W^X ليس نيّةً: يُقاس بالمشي في الجداول وعدّ ما يخالفه */
int sec_audit_kernel(void) {
    int wx = 0, total = 0, w = 0, x = 0;
    for (uint64_t va = (uint64_t)__kernel_start; va < (uint64_t)__kernel_end; va += PAGE_SIZE) {
        uint64_t *pte = vmm_pte(va, false);
        if (!pte || !(*pte & PTE_P)) continue;
        total++;
        bool writable   = (*pte & PTE_W) != 0;
        bool executable = (*pte & PTE_NX) == 0;
        if (writable) w++;
        if (executable) x++;
        if (writable && executable) {
            wx++;
            kprintf("       W+X page at %p  pte=%lx\n", (void *)va, *pte);
        }
    }
    INFO("kernel pages: %d mapped, %d writable, %d executable, %d BOTH", total, w, x, wx);
    return wx;
}

/* صفحةُ حراسة: فيضُ المكدَّس يصير `#PF` بعنوانٍ معلوم، لا فساداً صامتاً */
uint64_t sec_stack_with_guard(int pages) {
    static uint64_t next = 0xffffffffd0000000ull;
    uint64_t guard = next;
    next += PAGE_SIZE;                       /* تُترَك بلا مطابقة */
    uint64_t base = next;
    for (int i = 0; i < pages; i++) {
        uint64_t f = pmm_alloc();
        vmm_map(next, f, PTE_W | PTE_NX);
        next += PAGE_SIZE;
    }
    uint64_t top = next;
    next += PAGE_SIZE;                       /* فاصلٌ عن التالي */
    INFO("stack %p..%p, guard page at %p (unmapped)",
         (void *)base, (void *)top, (void *)guard);
    return top;
}
