#ifndef KHEAP_H
#define KHEAP_H
#include "kernel.h"
#define KHEAP_BASE 0xffffffffc0000000ull   /* فوق صورة النواة، ونافذةٌ نملكها */

void   kheap_init(void);
void  *kmalloc(size_t n);
void   kfree(void *p);
void   kheap_stats(size_t *used, size_t *blocks, size_t *frames);
void   kheap_dump(void);
#endif
