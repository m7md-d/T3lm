#ifndef GDT_H
#define GDT_H
#include "kernel.h"
/* الترتيب ليس ذوقاً: `sysret` في الفصل 15 يحمّل CS من STAR[63:48]+16
   وSS من +8، و`syscall` يحمّلهما من STAR[47:32] و+8. فالمواضع مثبّتةٌ الآن
   حتى لا يُعاد ترتيب الجدول حين تظهر الاستدعاءات. */
#define SEL_KCODE 0x08
#define SEL_KDATA 0x10
#define SEL_UDATA 0x18
#define SEL_UCODE 0x20
#define SEL_TSS   0x28

void gdt_build(void);   /* يملأ الجدول في الذاكرة */
void gdt_load(void);    /* lgdt ثم تحميل المحدِّدات — يصلح لكل معالج */
void tss_load(void);    /* ltr — والـTSS واحدٌ لا يُحمَّل مرّتين (الفصل 22) */
void gdt_init(void);    /* الاثنان معاً */
void tss_set_rsp0(uint64_t rsp0);
/* مكدَّسٌ بديلٌ يُحمَّل من الـTSS مهما كانت حالة الجاري (الفصل 25) */
void tss_set_ist(int index, uint64_t top);
uint64_t gdt_entry_raw(int index);
#endif
