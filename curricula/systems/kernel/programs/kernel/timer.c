/* 8254 PIT: مذبذبٌ بـ1193182 هرتز، ومقسومٌ من ١٦ بت يحدّد التردّد.
   ولا نستعمل APIC timer هنا: هذا أبسطُ مصدرٍ دوريّ، والبديهية ٢ تطلب
   أصغرَ آليةٍ خام تكفي. */
#include "timer.h"
#include "pic.h"
#include "idt.h"
#include "log.h"

#define PIT_CH0 0x40
#define PIT_CMD 0x43
#define PIT_BASE_HZ 1193182u

static volatile uint64_t tick_count;
static void (*on_tick)(void);
static void (*after_eoi)(void);

static void irq0(struct regs *r) {
    (void)r;
    tick_count++;
    if (on_tick) on_tick();
    pic_eoi(0);                 /* آخرُ شيء في الخدمة: بعده قد تصل التالية فوراً */
    if (after_eoi) after_eoi();  /* والاستباق هنا: الخطّ صار حرّاً قبل أن نبدّل */
}

void pit_init(uint32_t hz) {
    uint32_t div = PIT_BASE_HZ / hz;
    outb(PIT_CMD, 0x36);                       /* القناة ٠، بايتان، نمط ٣ (موجةٌ مربّعة) */
    outb(PIT_CH0, (uint8_t)(div & 0xFF));
    outb(PIT_CH0, (uint8_t)((div >> 8) & 0xFF));
    idt_set_handler(PIC_VECTOR_BASE + 0, irq0);
    pic_unmask(0);
}

uint64_t ticks(void) { return tick_count; }
void timer_on_tick(void (*fn)(void)) { on_tick = fn; }
void timer_after_eoi(void (*fn)(void)) { after_eoi = fn; }
