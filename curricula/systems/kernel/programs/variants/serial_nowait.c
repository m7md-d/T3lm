/* نسخةٌ واحدة تختلف في سطر: لا تنتظر «حوض الإرسال فارغ».
   تُستعمل في المرحلة 02x وحدها، وليست جزءاً من النواة. */
#include "kernel.h"
#include "serial.h"
#define COM1 0x3F8
void serial_init(void) {
    outb(COM1 + 1, 0x00); outb(COM1 + 3, 0x80); outb(COM1 + 0, 0x01);
    outb(COM1 + 1, 0x00); outb(COM1 + 3, 0x03); outb(COM1 + 2, 0xC7);
    outb(COM1 + 4, 0x0B);
}
void serial_putc(char c) {
    if (c == '\n') serial_putc('\r');
    outb(COM1 + 0, (uint8_t)c);          /* بلا فحص LSR */
}
void serial_write(const char *s) { while (*s) serial_putc(*s++); }
