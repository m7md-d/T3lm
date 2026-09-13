#ifndef TICKSRC_H
#define TICKSRC_H
#include "kernel.h"
/* جهازٌ يُنتِج بايتاً كلَّ عددٍ من النبضات. قراءتُه تحجب حين لا شيء. */
void ticksrc_init(uint32_t every_ticks);
void ticksrc_on_tick(void);       /* يُربَط بـtimer_on_tick */
uint64_t ticksrc_blocked_reads(void);
uint64_t ticksrc_produced(void);
#endif
