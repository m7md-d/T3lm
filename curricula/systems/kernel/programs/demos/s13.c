/* المرحلة 13 — الاستباق: المؤقّت يقطع خيطاً لا ينوي التنازل. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "pic.h"
#include "timer.h"
#include "thread.h"
#include "sched.h"

static volatile uint64_t spins[4];

/* لا `yield` هنا البتّة: حلقةٌ تحسب ولا تتنازل */
static void greedy0(void) { for (;;) spins[0]++; }
static void greedy1(void) { for (;;) spins[1]++; }
static void greedy2(void) { for (;;) spins[2]++; }

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8);
    pic_mask_all();
    pit_init(PIT_HZ_DEFAULT);
    timer_after_eoi(sched_tick);

    thread_bootstrap();
    sched_add(thread_current());
    sched_add(thread_create("g0", greedy0));
    sched_add(thread_create("g1", greedy1));
    sched_add(thread_create("g2", greedy2));

    INFO("three threads that never yield. preemption is OFF.");
    __asm__ volatile("sti");
    uint64_t t0 = ticks();
    while (ticks() < t0 + 50) __asm__ volatile("hlt");
    INFO("after 50 ticks: g0=%lu g1=%lu g2=%lu switches=%lu",
         spins[0], spins[1], spins[2], sched_switches());

    INFO("now turning preemption ON");
    sched_enable_preempt(true);
    t0 = ticks();
    while (ticks() < t0 + 200) __asm__ volatile("hlt");
    sched_enable_preempt(false);
    __asm__ volatile("cli");

    INFO("after 200 more ticks: switches=%lu", sched_switches());
    struct thread *tt = thread_table();
    for (int i = 0; i < thread_count(); i++)
        INFO("thread %d (%-4s) slices=%lu", tt[i].id, tt[i].name, tt[i].slices);
    INFO("g0 and g1 and g2 all advanced without ever calling yield()");
    qemu_exit(0);
}
