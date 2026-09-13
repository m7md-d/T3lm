#ifndef PIC_H
#define PIC_H
#include "kernel.h"
#define PIC_VECTOR_BASE 0x20        /* أوّلُ متّجهٍ بعد الاثنين والثلاثين المحجوزة */
void pic_remap(uint8_t master_base, uint8_t slave_base);
void pic_mask_all(void);
void pic_unmask(int irq);
void pic_eoi(int irq);
uint16_t pic_masks(void);
#endif
