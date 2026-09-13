/* المرحلة 09 — المؤقّت: النواة تستيقظ دورياً، ولا جدولةَ بعد. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "pic.h"
#include "timer.h"

static void every_tick(void) {
    uint64_t t = ticks();
    if (t % 100 == 0 && t) INFO("tick %lu — one second of PIT time", t);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init();
    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8);
    pic_mask_all();
    pit_init(PIT_HZ_DEFAULT);
    timer_on_tick(every_tick);

    INFO("PIT at %u Hz. ticks before sti = %lu", PIT_HZ_DEFAULT, ticks());
    __asm__ volatile("sti");

    /* حلقةٌ خاملة: `hlt` يوقف المعالج حتى تصل مقاطعة.
       وهذه هي البديهية ١ حرفياً — لا كود نواةٍ ينفَّذ بين النبضات. */
    while (ticks() < 300) __asm__ volatile("hlt");
    __asm__ volatile("cli");

    INFO("reached %lu ticks = %lu ms of PIT time", ticks(), ticks() * 1000 / PIT_HZ_DEFAULT);
    INFO("the kernel ran %lu times, and slept the rest", ticks());
    qemu_exit(0);
}
