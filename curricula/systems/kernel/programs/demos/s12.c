/* المرحلة 12 — الجدولة: طابورُ الجاهزين، والحالات، وما لا يُختار. */
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

static struct thread *sleeper;
static const char *SNAME[] = { "UNUSED", "READY", "RUNNING", "BLOCKED", "DEAD" };

static void show(const char *when) {
    struct thread *tt = thread_table();
    kprintf("       %-16s", when);
    for (int i = 0; i < thread_count(); i++)
        kprintf(" %s=%s", tt[i].name, SNAME[tt[i].state]);
    kprintf("\n");
}

static void waiter(void) {
    INFO("waiter: blocking myself. the queue must skip me.");
    thread_block();
    INFO("waiter: woken and running again");
}

static void waker(void) {
    for (int i = 0; i < 3; i++) { INFO("waker: pass %d", i); yield(); }
    INFO("waker: unblocking the waiter");
    thread_unblock(sleeper);
    yield();
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    thread_bootstrap();
    sched_add(thread_current());
    sleeper = thread_create("waiter", waiter);
    sched_add(sleeper);
    sched_add(thread_create("waker", waker));

    show("at start");
    for (int i = 0; i < 8; i++) yield();
    show("at end");
    INFO("switches = %lu", sched_switches());
    struct thread *tt = thread_table();
    for (int i = 0; i < thread_count(); i++)
        INFO("thread %d (%-6s) slices=%lu", tt[i].id, tt[i].name, tt[i].slices);
    qemu_exit(0);
}
