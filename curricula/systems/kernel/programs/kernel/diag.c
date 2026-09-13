#include "diag.h"
#include "vmm.h"
#include "log.h"
#include "kernel.h"

extern char __kernel_start[], __kernel_end[];

static bool readable(uint64_t va) {
    if (va < (uint64_t)__kernel_start && va < 0xffff800000000000ull) return false;
    uint64_t *pte = vmm_pte(va & ~0xfffull, false);
    return pte && (*pte & PTE_P);
}

/* سلسلةُ إطارات: كلُّ إطارٍ يحفظ `rbp` السابق عند [rbp]، وعنوان العودة عند [rbp+8].
   وهذا اصطلاحٌ **يكسره التحسين** ما لم يُطلَب `-fno-omit-frame-pointer`. */
void diag_backtrace(uint64_t rbp, int max) {
    kprintf("       backtrace (frame pointers):\n");
    for (int i = 0; i < max && rbp; i++) {
        if (!readable(rbp) || !readable(rbp + 8)) { kprintf("       [%d] rbp=%p unreadable, chain ends\n", i, (void *)rbp); return; }
        uint64_t next = ((uint64_t *)rbp)[0];
        uint64_t ret  = ((uint64_t *)rbp)[1];
        if (!ret) return;
        kprintf("       [%d] %p\n", i, (void *)ret);
        if (next <= rbp) return;                 /* السلسلة تصعد دائماً */
        rbp = next;
    }
}

void diag_panic_report(struct regs *r) {
    __asm__ volatile("cli");
    uint64_t cr2, cr3;
    __asm__ volatile("mov %%cr2,%0" : "=r"(cr2));
    __asm__ volatile("mov %%cr3,%0" : "=r"(cr3));
    kprintf("\n[PANIC] %s  (vector %lu)\n", exception_name(r->vector), r->vector);
    kprintf("       error=%lx  cr2=%p  cr3=%p\n", r->error, (void *)cr2, (void *)(cr3 & ~0xfffull));
    kprintf("       rip=%p  cs=%lx  rflags=%lx  cpl=%lu\n",
            (void *)r->rip, r->cs, r->rflags, r->cs & 3);
    kprintf("       rsp=%p  ss=%lx  rbp=%p\n", (void *)r->rsp, r->ss, (void *)r->rbp);
    kprintf("       rax=%lx rbx=%lx rcx=%lx rdx=%lx\n", r->rax, r->rbx, r->rcx, r->rdx);
    kprintf("       rsi=%lx rdi=%lx r8=%lx r9=%lx\n", r->rsi, r->rdi, r->r8, r->r9);
    diag_backtrace(r->rbp, 12);
    kprintf("[PANIC] halted. resolve addresses with:\n");
    kprintf("        llvm-addr2line -e out/26/kernel.elf -f -C <address>\n");
    halt_forever();
}

/* كلُّ متّجهٍ بلا معالجٍ خاصّ يصير تقريراً بدل صمت */
void diag_install(void) {
    for (int v = 0; v < 32; v++) idt_set_handler(v, diag_panic_report);
}
