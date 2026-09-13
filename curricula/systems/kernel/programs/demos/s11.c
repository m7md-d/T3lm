/* المرحلة 11 — التبديل التعاونيّ: A ← yield → B ← yield → A. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "thread.h"
#include "sched.h"

static void worker_a(void) {
    for (int i = 0; i < 3; i++) {
        INFO("A step %d   (rsp near %p)", i, (void *)&i);
        yield();
    }
    INFO("A done");
}
static void worker_b(void) {
    for (int i = 0; i < 3; i++) {
        INFO("B step %d   (rsp near %p)", i, (void *)&i);
        yield();
    }
    INFO("B done");
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    thread_bootstrap();
    struct thread *boot = thread_current();
    sched_add(boot);
    sched_add(thread_create("A", worker_a));
    sched_add(thread_create("B", worker_b));

    INFO("three threads. no timer, no preemption: only explicit yield().");
    for (int i = 0; i < 10; i++) {
        INFO("boot loop %d", i);
        yield();
    }
    INFO("switches = %lu", sched_switches());
    struct thread *tt = thread_table();
    for (int i = 0; i < thread_count(); i++)
        INFO("thread %d (%-5s) state=%d slices=%lu", tt[i].id, tt[i].name, tt[i].state, tt[i].slices);
    qemu_exit(0);
}
