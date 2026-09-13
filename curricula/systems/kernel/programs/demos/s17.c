/* المرحلة 17 — العملية: فضاءٌ وخيطٌ وجدولُ أوصافٍ وهُويّة.
   وعمليتان تعملان معاً، بنفس العناوين الافتراضية، في فضاءين مختلفين. */
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
#include "syscall.h"
#include "proc.h"
#include "../user/prog_elf.h"
#include "../user/counter_elf.h"

static void on_gp(struct regs *r) {
    INFO("#GP CPL=%lu rip=%p", r->cs & 3, (void *)r->rip);
    __asm__ volatile("cli"); qemu_exit(1);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    idt_set_handler(13, on_gp);
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8);
    pic_mask_all();
    pit_init(PIT_HZ_DEFAULT);
    timer_after_eoi(sched_tick);

    thread_bootstrap();
    thread_current()->cr3 = vmm_root_phys();
    sched_add(thread_current());
    uint64_t kstack = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(kstack);
    syscall_init(kstack);

    struct process *a = proc_spawn("prog",    prog_elf_blob,    sizeof prog_elf_blob);
    struct process *b = proc_spawn("counter", counter_elf_blob, sizeof counter_elf_blob);
    INFO("pid %d (%s) root=%p entry=%p", a->pid, a->name, (void *)a->root, (void *)a->entry);
    INFO("pid %d (%s) root=%p entry=%p", b->pid, b->name, (void *)b->root, (void *)b->entry);
    INFO("same entry address, different address spaces: %s",
         a->entry == b->entry ? "yes" : "no");
    INFO("entry %p resolves to %p in pid 1, and %p in pid 2", (void *)a->entry,
         (void *)vmm_resolve_in(a->root, a->entry), (void *)vmm_resolve_in(b->root, b->entry));

    INFO("--- enabling preemption; both processes run ---");
    sched_enable_preempt(true);
    __asm__ volatile("sti");
    while (proc_alive_count() > 0) __asm__ volatile("hlt");
    sched_enable_preempt(false);
    __asm__ volatile("cli");

    INFO("--- all processes finished ---");
    struct process *pt = proc_table();
    for (int i = 0; i < proc_count(); i++)
        INFO("pid %d (%-8s) exit=%d slices=%lu", pt[i].pid, pt[i].name,
             pt[i].exit_code, pt[i].main->slices);
    qemu_exit(0);
}
