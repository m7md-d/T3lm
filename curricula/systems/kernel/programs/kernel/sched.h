#ifndef SCHED_H
#define SCHED_H
#include "thread.h"
void sched_add(struct thread *t);
void schedule(void);          /* يختار التالي ويبدّل */
void yield(void);             /* تنازلٌ صريح */
void sched_enable_preempt(bool on);
bool sched_preempt_enabled(void);
uint64_t sched_switches(void);
void thread_block(void);
void thread_unblock(struct thread *t);
void sched_tick(void);        /* يُربَط بـtimer_after_eoi */
#endif
