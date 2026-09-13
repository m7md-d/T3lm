/* UART 16550 على COM1. المنفذ 0x3F8، وثمانية سجلّاتٍ متتابعةٍ بعده.
   بلا مقاطعات: نستقصي بت «حوض الإرسال فارغ» قبل كل بايت. الاستقصاء هنا
   مقصود — ما زلنا بلا IDT، فلا سبيل إلى مقاطعة. */
#include "kernel.h"
#include "serial.h"

#define COM1 0x3F8
#define R_DATA  0   /* بيانات، وأيضاً نصفُ المقسوم الأدنى حين DLAB=1 */
#define R_IER   1   /* تمكين المقاطعات، وأيضاً النصف الأعلى حين DLAB=1 */
#define R_FCR   2   /* ضبط الـFIFO */
#define R_LCR   3   /* ضبط الخطّ: عدد البتات والتماثل وDLAB */
#define R_MCR   4   /* ضبط المودم */
#define R_LSR   5   /* حالة الخطّ */
#define LSR_THR_EMPTY (1u << 5)

void serial_init(void) {
    outb(COM1 + R_IER, 0x00);   /* لا مقاطعات: لا IDT بعد */
    outb(COM1 + R_LCR, 0x80);   /* DLAB=1 ليصير 0 و1 نصفَي المقسوم */
    outb(COM1 + R_DATA, 0x01);  /* المقسوم 1 ⇒ 115200 باود */
    outb(COM1 + R_IER, 0x00);
    outb(COM1 + R_LCR, 0x03);   /* DLAB=0، ثمانية بتات، بلا تماثل، توقّفٌ واحد */
    outb(COM1 + R_FCR, 0xC7);   /* FIFO يعمل، ويُفرَّغ، وعتبته أربعة عشر */
    outb(COM1 + R_MCR, 0x0B);   /* DTR وRTS وOUT2 */
}

void serial_putc(char c) {
    if (c == '\n') serial_putc('\r');           /* الطرفية تريد CR قبل LF */
    while (!(inb(COM1 + R_LSR) & LSR_THR_EMPTY)) { }
    outb(COM1 + R_DATA, (uint8_t)c);
}

void serial_write(const char *s) { while (*s) serial_putc(*s++); }
