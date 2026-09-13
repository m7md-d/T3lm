/* المرحلة 26 — الختام: النظام يعمل، وحين ينهار يقول ما جرى. */
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
#include "diag.h"
#include "../user/prog_elf.h"

/* ثلاثةُ أشياء لازمة ليصير الأثرُ ثلاثَ طبقات، وكلُّها تقول الشيء نفسه:
   **الأثرُ يصف ما وُلِّد لا ما كُتب.**
     `noinline`   وإلّا دمج المترجم الثلاث في مناديها
     `sink++`     وإلّا صار النداءُ الأخير قفزةً (tail call) بلا إطار
     `-fno-omit-frame-pointer` وإلّا لم يُبنَ `rbp` سلسلةً أصلاً */
static volatile int sink;
__attribute__((noinline)) static void level3(void) { volatile int *p = (int *)0x1234; *p = 1; }
__attribute__((noinline)) static void level2(void) { level3(); sink++; }
__attribute__((noinline)) static void level1(void) { level2(); sink++; }

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init(); kheap_init();
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8); pic_mask_all();
    pit_init(PIT_HZ_DEFAULT); timer_after_eoi(sched_tick);
    thread_bootstrap(); thread_current()->cr3 = vmm_root_phys();
    sched_add(thread_current());
    uint64_t k = (uint64_t)kmalloc(4 * PAGE_SIZE) + 4 * PAGE_SIZE;
    tss_set_rsp0(k); syscall_init(k); syscall_trace(false);
    vfs_init();

    INFO("the whole system, in one boot:");
    INFO("  frames %lu free, heap mapped, IDT loaded, timer at %u Hz",
         pmm_free_frames(), PIT_HZ_DEFAULT);

    proc_spawn("prog", prog_elf_blob, sizeof prog_elf_blob);
    sched_enable_preempt(true);
    __asm__ volatile("sti");
    while (proc_alive_count() > 0) __asm__ volatile("hlt");
    sched_enable_preempt(false);
    __asm__ volatile("cli");
    proc_reap();
    INFO("a process ran in ring 3, was served, exited, and was reaped.");

    INFO("--- now a deliberate kernel bug, three calls deep ---");
    diag_install();
    level1();
    INFO("unreachable");
}
