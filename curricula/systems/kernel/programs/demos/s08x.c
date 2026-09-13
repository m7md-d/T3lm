/* المرحلة 08x — تجربةُ الفشل: تمكينُ IRQ0 بلا إعادة توجيه.
   المتّجه الافتراضيّ 0x08، وهو #DF في جدولنا. */
#include "kernel.h"
#include "serial.h"
#include "log.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "vmm.h"
#include "pic.h"

static void anything(struct regs *r) {
    INFO("interrupt vector %lu — our table calls that: %s",
         r->vector, exception_name(r->vector));
    INFO("but nothing divided, and no fault occurred. it is the timer.");
    __asm__ volatile("cli");
    qemu_exit(0);
}

void stage_main(void) {
    serial_init(); gdt_init(); pmm_init(); vmm_init(); idt_init();
    for (int v = 0; v < 16; v++) idt_set_handler(v, anything);
    INFO("not remapping. IRQ0 keeps its default vector 0x08.");
    outb(0x43, 0x36); outb(0x40, 0xFF); outb(0x40, 0xFF);
    pic_unmask(0);
    __asm__ volatile("sti");
    for (;;) __asm__ volatile("hlt");
}
