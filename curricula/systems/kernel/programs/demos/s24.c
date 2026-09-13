/* المرحلة 24 — الأنبوب: عمليتان لا تعرفان بعضهما، وحاجزٌ بينهما. */
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
#include "pipe.h"
#include "../user/sender_elf.h"
#include "../user/receiver_elf.h"

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8); pic_mask_all();
    pit_init(PIT_HZ_DEFAULT); timer_after_eoi(sched_tick);
    thread_bootstrap(); thread_current()->cr3 = vmm_root_phys();
    sched_add(thread_current());
    uint64_t k = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(k); syscall_init(k); syscall_trace(false);

    vfs_init();
    pipe_create("pipe", 16);          /* حاجزٌ صغيرٌ عمداً: ليُحجَب الكاتب */
    INFO("pipe capacity = 16 bytes, payload = 45 bytes");

    proc_spawn("receiver", receiver_elf_blob, sizeof receiver_elf_blob);
    proc_spawn("sender",   sender_elf_blob,   sizeof sender_elf_blob);

    sched_enable_preempt(true);
    __asm__ volatile("sti");
    while (proc_alive_count() > 0) __asm__ volatile("hlt");
    __asm__ volatile("cli");
    INFO("--- done ---");
    INFO("reader blocked %lu times, writer blocked %lu times",
         pipe_reader_blocks(), pipe_writer_blocks());
    qemu_exit(0);
}
