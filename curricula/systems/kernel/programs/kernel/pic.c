/* 8259A: رقاقتان متسلسلتان، ثمانيةُ خطوطٍ لكلٍّ منهما.
   ومتّجهاتُها الافتراضية 0x08..0x0F — وهي متّجهاتُ استثناءاتٍ يملكها المعالج.
   فالتصادم بنيويّ، وإعادةُ التوجيه شرطٌ لا تحسين. */
#include "pic.h"

#define M_CMD 0x20
#define M_DAT 0x21
#define S_CMD 0xA0
#define S_DAT 0xA1

/* منفذٌ بلا معنًى، الكتابةُ إليه تأخيرٌ قصير: الرقاقة أبطأ من المعالج */
static inline void io_wait(void) { outb(0x80, 0); }

void pic_remap(uint8_t mb, uint8_t sb) {
    uint8_t m = inb(M_DAT), s = inb(S_DAT);      /* نحفظ الأقنعة */
    outb(M_CMD, 0x11); io_wait();                /* ICW1: بدءُ التهيئة، وسيأتي ICW4 */
    outb(S_CMD, 0x11); io_wait();
    outb(M_DAT, mb);   io_wait();                /* ICW2: أوّلُ متّجه */
    outb(S_DAT, sb);   io_wait();
    outb(M_DAT, 0x04); io_wait();                /* ICW3: التابعةُ على الخطّ ٢ */
    outb(S_DAT, 0x02); io_wait();
    outb(M_DAT, 0x01); io_wait();                /* ICW4: نمط 8086 */
    outb(S_DAT, 0x01); io_wait();
    outb(M_DAT, m);
    outb(S_DAT, s);
}

void pic_mask_all(void) { outb(M_DAT, 0xFF); outb(S_DAT, 0xFF); }

void pic_unmask(int irq) {
    uint16_t port = irq < 8 ? M_DAT : S_DAT;
    uint8_t bit = (uint8_t)(irq < 8 ? irq : irq - 8);
    outb(port, (uint8_t)(inb(port) & ~(1u << bit)));
    if (irq >= 8) outb(M_DAT, (uint8_t)(inb(M_DAT) & ~(1u << 2)));  /* افتح خطّ التسلسل */
}

/* «انتهيتُ»: بدونها لا ترسل الرقاقة نفس الخطّ مرّةً أخرى أبداً */
void pic_eoi(int irq) {
    if (irq >= 8) outb(S_CMD, 0x20);
    outb(M_CMD, 0x20);
}

uint16_t pic_masks(void) { return (uint16_t)(inb(M_DAT) | (inb(S_DAT) << 8)); }
