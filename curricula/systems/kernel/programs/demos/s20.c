/* المرحلة 20 — الانتظار: نومٌ ويقظةٌ بدل حلقةٍ تحرق نواة. */
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
#include "vfs.h"
#include "ticksrc.h"
#include "../user/reader_elf.h"

static volatile uint64_t idle_hlts;

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8); pic_mask_all();
    pit_init(PIT_HZ_DEFAULT); timer_after_eoi(sched_tick);
    thread_bootstrap(); thread_current()->cr3 = vmm_root_phys();
    sched_add(thread_current());
    uint64_t k = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(k); syscall_init(k); syscall_trace(false);

    vfs_init();
    ticksrc_init(25);                 /* بايتٌ كلَّ ٢٥ نبضة = رُبعُ ثانية */
    INFO("device /ticks produces one byte every 25 ticks");

    proc_spawn("reader", reader_elf_blob, sizeof reader_elf_blob);
    sched_enable_preempt(true);
    __asm__ volatile("sti");
    while (proc_alive_count() > 0) { idle_hlts++; __asm__ volatile("hlt"); }
    __asm__ volatile("cli");

    INFO("--- done ---");
    INFO("bytes produced   = %lu", ticksrc_produced());
    INFO("blocking waits   = %lu", ticksrc_blocked_reads());
    INFO("ticks elapsed    = %lu", ticks());
    INFO("the reader slept through %lu ticks and spun zero times", ticks());
    qemu_exit(0);
}
