/* المرحلة 19 — VFS وجدولُ الأوصاف. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "kheap.h"
#include "string.h"
#include "pic.h"
#include "timer.h"
#include "thread.h"
#include "sched.h"
#include "syscall.h"
#include "proc.h"
#include "vfs.h"
#include "../user/filer_elf.h"

static void seed(const char *name, const char *text) {
    struct inode *n = vfs_create(name, 128);
    int fh = vfs_open(name);
    vfs_write(fh, text, strlen(text));
    vfs_close(fh);
    INFO("  %-8s %zu bytes", n->name, n->size);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8); pic_mask_all();
    pit_init(PIT_HZ_DEFAULT); timer_after_eoi(sched_tick);
    thread_bootstrap(); thread_current()->cr3 = vmm_root_phys();
    sched_add(thread_current());
    uint64_t k = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(k); syscall_init(k);
    syscall_trace(false);      /* المخرَج هنا مخرَجُ المستخدم، والأثرُ يحجبه */

    vfs_init();
    INFO("ramfs contents:");
    seed("motd",  "welcome to a kernel with files\n");
    seed("notes", "an inode is what exists; a file is an open position on it\n");
    INFO("nodes=%d", vfs_node_count());

    proc_spawn("filer", filer_elf_blob, sizeof filer_elf_blob);
    sched_enable_preempt(true);
    __asm__ volatile("sti");
    while (proc_alive_count() > 0) __asm__ volatile("hlt");
    __asm__ volatile("cli");
    INFO("--- done ---");
    qemu_exit(0);
}
