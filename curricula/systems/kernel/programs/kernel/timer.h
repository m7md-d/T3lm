#ifndef TIMER_H
#define TIMER_H
#include "kernel.h"
#define PIT_HZ_DEFAULT 100
void     pit_init(uint32_t hz);
uint64_t ticks(void);
void     timer_on_tick(void (*fn)(void));
/* يُنادى **بعد** EOI: التبديل قبله يترك الخطّ «قيد الخدمة» عبر التبديل */
void     timer_after_eoi(void (*fn)(void));
#endif
