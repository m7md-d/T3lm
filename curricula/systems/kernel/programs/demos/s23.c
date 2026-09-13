/* المرحلة 23 — دورةُ حياة العملية: إنشاءٌ وموتٌ واستردادٌ منفصل. */
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

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8); pic_mask_all();
    pit_init(PIT_HZ_DEFAULT); timer_after_eoi(sched_tick);
    thread_bootstrap(); thread_current()->cr3 = vmm_root_phys();
    sched_add(thread_current());
    uint64_t k = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(k); syscall_init(k); syscall_trace(false);

    uint64_t base = pmm_free_frames();
    INFO("free frames at start: %lu", base);

    for (int gen = 0; gen < 3; gen++) {
        uint64_t before = pmm_free_frames();
        proc_spawn("prog", prog_elf_blob, sizeof prog_elf_blob);
        uint64_t after_spawn = pmm_free_frames();

        sched_enable_preempt(true);
        __asm__ volatile("sti");
        while (proc_alive_count() > 0) __asm__ volatile("hlt");
        __asm__ volatile("cli");
        sched_enable_preempt(false);
        uint64_t after_exit = pmm_free_frames();

        uint64_t freed = proc_reap();
        uint64_t after_reap = pmm_free_frames();

        INFO("gen %d: spawn cost %lu frames, exit returned %lu, reap returned %lu",
             gen, before - after_spawn, after_exit - after_spawn, after_reap - after_exit);
        INFO("       free: %lu -> %lu   (leak so far: %ld)   reaped %lu frames",
             before, after_reap, (int64_t)base - (int64_t)after_reap, freed);
    }
    INFO("--- three generations, and the count returns ---");
    qemu_exit(0);
}
