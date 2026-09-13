#ifndef DIAG_H
#define DIAG_H
#include "idt.h"
/* تقريرُ الانهيار: ما الذي وقع، وأين، وكيف وصل التنفيذ إلى هناك. */
void diag_backtrace(uint64_t rbp, int max);
void diag_panic_report(struct regs *r);
void diag_install(void);
#endif
