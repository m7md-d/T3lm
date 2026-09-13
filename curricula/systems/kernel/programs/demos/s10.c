/* المرحلة 10 — ما هو execution context، وما أقلُّ ما يُحفَظ. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "thread.h"

static void never_runs(void) { for (;;) { } }

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();

    thread_bootstrap();
    INFO("the running code is now thread %d (%s), rsp saved = %p",
         thread_current()->id, thread_current()->name, (void *)thread_current()->rsp);

    struct thread *t = thread_create("worker", never_runs);
    INFO("created thread %d (%s)", t->id, t->name);
    INFO("  stack base = %p   size = %lu bytes", (void *)t->stack_base,
         (uint64_t)KSTACK_PAGES * PAGE_SIZE);
    INFO("  saved rsp  = %p   (%lu bytes below the top)",
         (void *)t->rsp, t->stack_base + KSTACK_PAGES * PAGE_SIZE - t->rsp);

    /* المكدَّس الابتدائيّ ليس فارغاً: هو حالةٌ مبنيّةٌ بأيدينا */
    static const char *SLOT[6] = { "r15", "r14", "r13", "r12", "rbx", "rbp" };
    uint64_t *sp = (uint64_t *)t->rsp;
    for (int i = 0; i < 6; i++)
        kprintf("       [rsp+%2d] = %p   %s%s\n", i * 8, (void *)sp[i], SLOT[i],
                i == 0 ? "  <- the entry point, carried in r15" : "");
    kprintf("       [rsp+48] = %p   <- what `ret` jumps to (thread_trampoline)\n", (void *)sp[6]);
    kprintf("       [rsp+56] = %p   <- where the entry returns to (thread_exit)\n", (void *)sp[7]);

    INFO("state=%d (T_READY=%d). nothing has run it yet.", t->state, T_READY);
    qemu_exit(0);
}
