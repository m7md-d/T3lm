#ifndef PMM_H
#define PMM_H
#include "kernel.h"
void     pmm_init(void);
uint64_t pmm_alloc(void);          /* إطارٌ مصفَّر، أو 0 إن نفدت */
void     pmm_free(uint64_t phys);
uint64_t pmm_total_frames(void);   /* ما يغطّيه الـbitmap */
uint64_t pmm_usable_frames(void);  /* ما أعلنه الـfirmware قابلاً للاستعمال */
uint64_t pmm_free_frames(void);
void     pmm_report(void);         /* يطبع الخريطة والإحصاء */
#endif
