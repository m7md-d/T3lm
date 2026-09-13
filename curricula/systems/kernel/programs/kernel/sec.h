#ifndef SEC_H
#define SEC_H
#include "kernel.h"
bool     sec_smep_supported(void);
bool     sec_smap_supported(void);
void     sec_enable_smep(void);
int      sec_audit_kernel(void);      /* يعدّ صفحات النواة القابلة للكتابة والتنفيذ معاً */
uint64_t sec_stack_with_guard(int pages);  /* يعيد القمّة، وتحتها صفحةٌ بلا مطابقة */
/* ينفّذ `fn(arg)` على مكدَّسٍ آخر — في `sec.S` */
void call_on_stack(uint64_t stack_top, void (*fn)(uint64_t), uint64_t arg);
#endif
