/* المرحلة 08 — من يقرّر أيُّ متّجهٍ يصل إلى المعالج. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "pic.h"

static volatile int hits;
static void on_irq0(struct regs *r) {
    hits++;
    if (hits <= 3) INFO("vector %lu arrived: this is IRQ0 after remapping", r->vector);
    pic_eoi(0);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init();

    INFO("PIC masks as the bootloader left them: %x", pic_masks());
    INFO("default PIC vectors are 0x08..0x0F — and 0x08 is %s", exception_name(8));
    INFO("so IRQ0 would be indistinguishable from a double fault");

    pic_remap(PIC_VECTOR_BASE, PIC_VECTOR_BASE + 8);
    pic_mask_all();
    INFO("after remap: IRQ0 -> vector %u (%s)", PIC_VECTOR_BASE, exception_name(PIC_VECTOR_BASE));

    idt_set_handler(PIC_VECTOR_BASE + 0, on_irq0);
    /* PIT بأبطأ تردّدٍ ممكن حتى نعدّ نبضاتٍ قليلة */
    outb(0x43, 0x36); outb(0x40, 0xFF); outb(0x40, 0xFF);
    pic_unmask(0);
    INFO("masks now %x, enabling interrupts", pic_masks());

    __asm__ volatile("sti");
    while (hits < 3) __asm__ volatile("hlt");
    __asm__ volatile("cli");
    INFO("three interrupts delivered, hits=%d", hits);
    qemu_exit(0);
}
