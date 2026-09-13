#ifndef SMP_H
#define SMP_H
#include "kernel.h"
int      smp_cpu_count(void);
uint32_t smp_bsp_lapic(void);
int      smp_online(void);
bool     smp_start_aps(void (*entry)(uint32_t lapic_id));
uint32_t smp_this_lapic(void);
#endif
